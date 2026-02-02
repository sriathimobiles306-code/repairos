-- PHASE 4.2: TENANT SQL SCHEMA (Tenant Data)
-- Owner: Tenant (Shop)
-- Isolation: Row-Level (tenant_id mandatory)
-- Billing Source of Truth: subscriptions table

-- 1. TENANTS (Root Entity)
CREATE TABLE tenants (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    business_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PLANS (Feature Definitions)
-- Global definitions, but referenced by tenants.
CREATE TABLE plans (
    id BIGSERIAL PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL UNIQUE, -- 'BASIC', 'PRO', 'ENTERPRISE'
    
    -- Feature Flags & Limits (JSON for flexibility)
    -- e.g., { "allow_universal": true, "max_users": 3, "universal_limit_per_day": 5 }
    features_json JSONB NOT NULL DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. SUBSCRIPTIONS (Billing Source of Truth)
CREATE TABLE subscriptions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id BIGINT NOT NULL REFERENCES plans(id),
    
    status VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Snapshot of limits at time of billing to prevent grandfathering issues
    features_snapshot_json JSONB,
    
    payment_provider_id VARCHAR(100), -- Stripe/Razorpay Sub ID
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enforce only one ACTIVE subscription per tenant (Allowing history)
CREATE UNIQUE INDEX idx_one_active_subscription 
ON subscriptions (tenant_id) 
WHERE status IN ('ACTIVE', 'TRIALING', 'PAST_DUE');

-- 4. TENANT USERS
CREATE TABLE tenant_users (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    
    role VARCHAR(20) NOT NULL CHECK (role IN ('OWNER', 'STAFF')),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

-- 5. SEARCH HISTORY (Operational Data)
-- Safe to purge, high volume. Index optimized for tenant filtering.
CREATE TABLE search_history (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES tenant_users(id) ON DELETE SET NULL,
    
    -- Input
    search_query VARCHAR(200),
    
    -- Result (Logged for Analytics)
    matched_model_id BIGINT, -- No FK to global to avoid lock contention
    matched_screen_id BIGINT,
    result_status VARCHAR(20), -- 'EXACT', 'UNIVERSAL', 'NO_MATCH'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. MISMATCH REPORTS (Feedback Loop)
CREATE TABLE mismatch_reports (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES tenant_users(id),
    
    -- Context
    model_id BIGINT NOT NULL, -- Logical reference to global model
    screen_id BIGINT NOT NULL, -- Logical reference to global screen
    suggested_glass_sku VARCHAR(50),
    
    -- Feedback
    issue_type VARCHAR(50) CHECK (issue_type IN ('TOO_BIG', 'TOO_SMALL', 'WRONG_CUTOUT', 'LIFTING_EDGES', 'OTHER')),
    description TEXT,
    photo_urls TEXT[], -- Array of S3/Blob URLs
    
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES (Tenant Isolation & Performance)
-- Critical: Every query filters by tenant_id first.
CREATE INDEX idx_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_history_tenant_date ON search_history(tenant_id, created_at DESC);
CREATE INDEX idx_reports_tenant ON mismatch_reports(tenant_id);
CREATE INDEX idx_subs_tenant ON subscriptions(tenant_id);

-- COMMENTARY
COMMENT ON TABLE subscriptions IS 'The Single Source of Truth for billing and feature access. Middleware checks this, not JWT.';
COMMENT ON TABLE search_history IS 'Operational logs. Can be partitioned or purged based on retention policy.';
COMMENT ON COLUMN tenant_users.role IS 'Role changes to OWNER must be restricted at application layer.';
