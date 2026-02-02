-- PHASE 4.3: PRECOMPUTED MATCHES (Operational Cache)
-- Owner: System (Background Job)
-- Access: Read-Only for API, Write for Background Job
-- Isolation: Global (No tenant_id)

CREATE TABLE precomputed_matches (
    screen_id BIGINT PRIMARY KEY REFERENCES screens(id),
    
    -- PRECOMPUTED RESULT (JSONB for fast read/write)
    -- Structure:
    -- {
    --   "matches": [
    --     { 
    --       "sku_code": "...", 
    --       "confidence": 1.0, 
    --       "status": "EXACT", 
    --       "confidence_breakdown": { ... },
    --       "warnings": []
    --     },
    --     ...
    --   ],
    --   "meta": { "total_count": 15, "universal_count": 14 }
    -- }
    matches_json JSONB NOT NULL,
    
    -- SEARCH OPTIMIZATION
    -- Sorted array of SKU IDs for quick "Does this screen have this glass?" checks
    ordered_sku_ids BIGINT[] DEFAULT '{}',
    
    has_exact_match BOOLEAN DEFAULT FALSE,
    best_universal_confidence DECIMAL(4, 3) DEFAULT 0.000,
    
    -- CACHE CONTROL
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_version_hash VARCHAR(64), -- SHA of Screen+Glass state at computation
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup
CREATE INDEX idx_precomputed_screen ON precomputed_matches(screen_id);

-- COMMENTARY
COMMENT ON TABLE precomputed_matches IS 'Cache of deterministic matches. Rebuilt by job when Screen/Glass data changes. NO TENANT DATA.';
