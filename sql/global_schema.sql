-- PHASE 4.1: GLOBAL SQL SCHEMA (Global Data)
-- Owner: Platform
-- Access: Read-Only for Tenants
-- Identity: BIGINT (BIGSERIAL) Used consistently

-- 1. BRANDS
CREATE TABLE brands (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Auditing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_role VARCHAR(20) CHECK (created_by_role IN ('EDITOR', 'APPROVER', 'SYSTEM')),
    
    CONSTRAINT unique_brand_name UNIQUE (name),
    CONSTRAINT unique_brand_slug UNIQUE (slug)
);

-- 2. SCREENS (Immutable Core Atom)
-- Rules: No UPDATEs to geometry columns allowed. New geometry = New Record.

-- Define custom type for notch_type
CREATE TYPE notch_type AS ENUM ('NONE', 'U_NOTCH', 'V_NOTCH', 'PUNCH_HOLE_CENTER', 'PUNCH_HOLE_CORNER', 'DYNAMIC_ISLAND');

CREATE TABLE screens (
    id BIGSERIAL PRIMARY KEY,
    -- Geometry Hash for duplicate detection (SHA256 of dimensions sorted)
    geometry_hash VARCHAR(64) NOT NULL UNIQUE,
    
    -- Geometric Properties
    diagonal_inch DECIMAL(4, 2) NOT NULL,
    width_mm DECIMAL(5, 2) NOT NULL,
    height_mm DECIMAL(5, 2) NOT NULL,
    corner_radius_mm DECIMAL(4, 2) DEFAULT 0.00,
    
    -- Display Properties [NEW Phase 9]
    display_resolution VARCHAR(20),     -- e.g. "1080x2400"
    connection_type VARCHAR(50),        -- e.g. "FPC_SAMS_A54_V1" (The Connector ID)
    panel_technology VARCHAR(20),       -- e.g. "IPS", "OLED", "AMOLED"
    refresh_rate_hz INT DEFAULT 60,     -- e.g. 90, 120

    -- Shape Properties
    notch_type notch_type NOT NULL DEFAULT 'NONE',
    notch_width_mm DECIMAL(5, 2) DEFAULT 0.00,
    notch_height_mm DECIMAL(5, 2) DEFAULT 0.00,
    bezel_margin_mm DECIMAL(3, 2), -- Distance from pixel edge to glass edge
    
    -- Advanced Geometry (Deterministic Engine Inputs)
    active_area_width_mm DECIMAL(5, 2) NOT NULL,
    active_area_height_mm DECIMAL(5, 2) NOT NULL,
    
    -- Shape & Cutout
    curved_type VARCHAR(20) NOT NULL CHECK (curved_type IN ('FLAT', '2.5D', 'CURVED_3D', 'FOLDABLE')),
    cutout_shape VARCHAR(50) NOT NULL, -- e.g., 'punch_hole_center'
    cutout_mask_svg TEXT NOT NULL, -- Normalized (0..1) SVG path for intersection checks. Must NOT be NULL.
    
    -- Tolerance Configuration
    fit_tolerances JSONB NOT NULL DEFAULT '{"max_oversize": 0.0, "min_undersize": 2.0}',
    
    -- Auditing (Immutable: No updated_at)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_role VARCHAR(20) CHECK (created_by_role IN ('EDITOR', 'APPROVER', 'SYSTEM'))
);

-- 3. MOBILE MODELS
CREATE TABLE mobile_models (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES brands(id),
    name VARCHAR(150) NOT NULL,
    release_date DATE,
    aliases TEXT[], -- Array of alternate street names
    
    -- Auditing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_role VARCHAR(20) CHECK (created_by_role IN ('EDITOR', 'APPROVER', 'SYSTEM')),
    
    CONSTRAINT unique_model_per_brand UNIQUE (brand_id, name)
);

-- 4. MODEL SCREEN MAP (Versioned / History)
-- "Mapped to one active screen at a time, with historical mappings preserved."
CREATE TABLE model_screen_map (
    id BIGSERIAL PRIMARY KEY,
    model_id BIGINT NOT NULL REFERENCES mobile_models(id) ON DELETE CASCADE,
    screen_id BIGINT NOT NULL REFERENCES screens(id) ON DELETE RESTRICT,
    
    -- Verification Metadata
    confidence_score DECIMAL(4, 3) DEFAULT 1.000 CHECK (confidence_score BETWEEN 0.000 AND 1.000),
    verification_source VARCHAR(50) CHECK (verification_source IN ('PHYSICAL', 'SPEC_SHEET', 'USER_REPORT', 'ESTIMATED')),
    verified_by_user_id BIGINT, -- Platform Admin ID
    
    -- Versioning Control
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_to TIMESTAMP WITH TIME ZONE, -- NULL = Current
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_role VARCHAR(20) CHECK (created_by_role IN ('EDITOR', 'APPROVER', 'SYSTEM'))
);

-- Enforce only one ACTIVE map per model
CREATE UNIQUE INDEX idx_one_active_screen_per_model 
ON model_screen_map (model_id) 
WHERE is_active = TRUE;

-- 5. TEMPERED GLASS SKUS
CREATE TABLE tempered_glass_skus (
    id BIGSERIAL PRIMARY KEY,
    sku_code VARCHAR(50) NOT NULL UNIQUE,
    screen_id BIGINT NOT NULL REFERENCES screens(id), -- The "Target" or "Native" screen
    
    manuf_brand VARCHAR(100),
    marketing_name VARCHAR(150),
    
    -- Physical Glass Geometry (for Reverse Matching)
    glass_width_mm DECIMAL(5, 2) NOT NULL,
    glass_height_mm DECIMAL(5, 2) NOT NULL,
    glass_curvature VARCHAR(20) NOT NULL CHECK (glass_curvature IN ('FLAT', '2.5D', 'CURVED_3D')),
    glass_corner_radius_mm DECIMAL(4, 2) DEFAULT 0.00,
    stock_quantity INT NOT NULL DEFAULT 0,
    
    -- Compatibility Metadata
    edge_coverage VARCHAR(20) CHECK (edge_coverage IN ('FULL_GLUE', 'BORDER_GLUE', 'CASE_FRIENDLY', 'EDGE_TO_EDGE')),
    thickness_mm DECIMAL(3, 2),
    cutout_mask_svg TEXT, -- Physical holes in the glass
    cutout_alignment_offset_mm DECIMAL(4, 2) DEFAULT 0.5, -- Allowed misalignment
    
    -- Auditing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_role VARCHAR(20) CHECK (created_by_role IN ('EDITOR', 'APPROVER', 'SYSTEM'))
);

-- 6. UNIVERSAL GLASS RULES (The Fuzzy Layer)
CREATE TABLE universal_glass_rules (
    id BIGSERIAL PRIMARY KEY,
    source_screen_id BIGINT NOT NULL REFERENCES screens(id), -- The glass geometry source
    target_screen_id BIGINT NOT NULL REFERENCES screens(id), -- The phone being fitted
    
    fit_score DECIMAL(5, 2) NOT NULL CHECK (fit_score BETWEEN 0 AND 100),
    is_safe_to_recommend BOOLEAN DEFAULT FALSE,
    
    -- Detailed Warnings
    warnings TEXT[], -- e.g. ["Gap 1mm left", "Chin exposed"]
    fit_vector_json JSONB, -- { "width_delta": -1.2, "height_delta": -0.5 }
    
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by BIGINT, -- ID of DATA_APPROVER

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by_role VARCHAR(20) CHECK (created_by_role IN ('EDITOR', 'APPROVER', 'SYSTEM')),
    
    -- Guardrail: Safe ONLY if approved
    CONSTRAINT check_safe_needs_approval CHECK (
        (is_safe_to_recommend = FALSE) OR (is_safe_to_recommend = TRUE AND approved_at IS NOT NULL)
    ),

    CONSTRAINT unique_rule_pair UNIQUE (source_screen_id, target_screen_id)
);

-- 7. AUDIT LOGS (Append-Only Black Box)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'SCREEN', 'MODEL', 'MAP_CHANGE'
    entity_id BIGINT NOT NULL,
    
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE', 'PUBLISH', 'ROLLBACK')),
    
    -- Diff Storage
    old_state JSONB,
    new_state JSONB,
    
    -- Who did it
    actor_id BIGINT NOT NULL, -- Platform Admin ID
    actor_role VARCHAR(20) NOT NULL,
    
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for Performance
CREATE INDEX idx_models_brand ON mobile_models(brand_id);
CREATE INDEX idx_glass_screen ON tempered_glass_skus(screen_id);
CREATE INDEX idx_map_model ON model_screen_map(model_id);
CREATE INDEX idx_map_screen ON model_screen_map(screen_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- TRIGGER: Prevent Screen Geometry Updates (Immutability)
CREATE OR REPLACE FUNCTION prevent_screen_geometry_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    NEW.width_mm IS DISTINCT FROM OLD.width_mm OR
    NEW.height_mm IS DISTINCT FROM OLD.height_mm OR
    NEW.active_area_width_mm IS DISTINCT FROM OLD.active_area_width_mm OR
    NEW.active_area_height_mm IS DISTINCT FROM OLD.active_area_height_mm OR
    NEW.corner_radius_mm IS DISTINCT FROM OLD.corner_radius_mm OR
    NEW.cutout_mask_svg IS DISTINCT FROM OLD.cutout_mask_svg OR
    NEW.curved_type IS DISTINCT FROM OLD.curved_type
  ) THEN
    RAISE EXCEPTION 'Screen geometry is immutable. Create a new screen record instead.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immutable_screens
BEFORE UPDATE ON screens
FOR EACH ROW
EXECUTE FUNCTION prevent_screen_geometry_update();

-- COMMENT ON TABLE screens IS 'Immutable definitions of screen geometry. Trigger trg_immutable_screens prevents updates to physics columns.';
COMMENT ON COLUMN model_screen_map.is_active IS 'Only one map active per model. History preserved.';
COMMENT ON COLUMN universal_glass_rules.is_safe_to_recommend IS 'Guardrail. False means technically compatible but operationally risky.';

-- 8. ADMINISTRATORS (Purely Separate from Users) [NEW Request]
CREATE TABLE administrators (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN', -- SUPER_ADMIN, STORE_MANAGER
    tenant_id INT, -- Nullable for Super Admin, Set for Store Admins
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. TENANCY & SUBSCRIPTIONS [NEW Phase 5]
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tenant_users (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id),
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    role VARCHAR(20) CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(50) NOT NULL UNIQUE, -- 'BASIC', 'PRO', 'ENTERPRISE'
    features_json JSONB, -- { "universal_limit": 50, "api_access": false }
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES tenants(id),
    plan_id INT NOT NULL REFERENCES plans(id),
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, PAST_DUE, CANCELED
    
    -- Usage Tracking
    usage_count INT DEFAULT 0,
    usage_limit INT DEFAULT 50, -- Denormalized limit for speed, or lookup from Plan
    
    current_period_start TIMESTAMP DEFAULT NOW(),
    current_period_end TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. PART FINDER (IC Compatibility) [NEW Phase 11]
CREATE TABLE electronic_parts (
    id SERIAL PRIMARY KEY,
    part_code VARCHAR(100) NOT NULL UNIQUE, -- e.g. "PM8953"
    category VARCHAR(50) DEFAULT 'IC', -- 'IC', 'CONNECTOR', 'LCD'
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE part_compatibility (
    id SERIAL PRIMARY KEY,
    part_id INT NOT NULL REFERENCES electronic_parts(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    notes TEXT, -- e.g. "Only V1.0 board"
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_part_model_pair UNIQUE (part_id, brand, model)
);
