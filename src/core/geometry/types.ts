// src/core/geometry/types.ts

export enum Curvature {
    FLAT = 'FLAT',
    TWO_POINT_FIVE_D = '2.5D',
    CURVED_3D = 'CURVED_3D',
    FOLDABLE = 'FOLDABLE',
}

export enum EdgeCoverage {
    FULL_GLUE = 'FULL_GLUE',
    BORDER_GLUE = 'BORDER_GLUE',
    CASE_FRIENDLY = 'CASE_FRIENDLY',
    EDGE_TO_EDGE = 'EDGE_TO_EDGE',
}

export enum MatchStatus {
    EXACT = 'EXACT',
    UNIVERSAL = 'UNIVERSAL',
    INCOMPATIBLE = 'INCOMPATIBLE',
}

export interface ToleranceConfig {
    max_oversize_mm: number;
    min_undersize_mm: number;
    allowed_misalignment_mm: number;
}

export interface ScreenGeometry {
    id: string; // or number (using string for generic ID)
    dimensions: { width_mm: number; height_mm: number };
    active_area: { width_mm: number; height_mm: number };
    curvature: Curvature;
    corner_radius_mm: number;
    cutout_mask_svg: string; // Normalized 0..1 SVG path
    fit_tolerances: ToleranceConfig;
}

export interface GlassGeometry {
    sku_code: string;
    dimensions: { width_mm: number; height_mm: number };
    curvature: Curvature;
    corner_radius_mm: number;
    cutout_mask_svg: string;
    edge_coverage: EdgeCoverage;
    cutout_alignment_offset_allowance_mm: number;
}

export interface UniversalRule {
    target_screen_id: string;
    source_screen_id: string; // or glass_sku
    fit_score: number; // 0-100
    is_safe: boolean;
    warnings: string[];
}

export interface ConfidenceBreakdown {
    id_match: number;        // 1.0 or 0.0
    geometry_penalty: number; // Negative value
    cutout_penalty: number;   // Negative value
    curvature_penalty: number; // Negative value
    verification_bonus: number; // Positive value
}

export interface MatchResult {
    status: MatchStatus;
    confidence: number;
    confidence_breakdown: ConfidenceBreakdown;
    warnings: string[];
    rejection_reasons: string[]; // Detailed reasons for INCOMPATIBLE
    metadata: {
        is_native: boolean;
        computed_at: Date;
    };
}
