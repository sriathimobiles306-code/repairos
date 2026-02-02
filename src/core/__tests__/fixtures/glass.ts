// src/core/__tests__/fixtures/glass.ts
import { GlassGeometry, Curvature, EdgeCoverage } from '../../geometry/types';

export const ExactGlassFlat: GlassGeometry = {
    sku_code: 'screen_flat_01', // Matches screen id implies native intent in some contexts, but logic relies on dims
    dimensions: { width_mm: 70.0, height_mm: 150.0 },
    curvature: Curvature.FLAT,
    corner_radius_mm: 2.0,
    cutout_mask_svg: 'none',
    edge_coverage: EdgeCoverage.FULL_GLUE,
    cutout_alignment_offset_allowance_mm: 0.5
};

export const ExactGlassPunchHole: GlassGeometry = {
    sku_code: 'screen_ph_01',
    dimensions: { width_mm: 72.0, height_mm: 160.0 },
    curvature: Curvature.FLAT,
    corner_radius_mm: 2.5,
    cutout_mask_svg: 'circle(0.5, 0.1, 0.05)',
    edge_coverage: EdgeCoverage.FULL_GLUE,
    cutout_alignment_offset_allowance_mm: 0.5
};

export const UniversalGlassValid: GlassGeometry = {
    sku_code: 'univ_01',
    dimensions: { width_mm: 69.5, height_mm: 149.0 }, // Slightly smaller than FlatScreen
    curvature: Curvature.FLAT,
    corner_radius_mm: 2.0,
    cutout_mask_svg: 'none',
    edge_coverage: EdgeCoverage.CASE_FRIENDLY,
    cutout_alignment_offset_allowance_mm: 1.0
};

export const UndersizeGlass: GlassGeometry = {
    sku_code: 'univ_small',
    dimensions: { width_mm: 65.0, height_mm: 140.0 }, // Way too small
    curvature: Curvature.FLAT,
    corner_radius_mm: 2.0,
    cutout_mask_svg: 'none',
    edge_coverage: EdgeCoverage.CASE_FRIENDLY,
    cutout_alignment_offset_allowance_mm: 1.0
};

export const OversizeGlass: GlassGeometry = {
    sku_code: 'univ_big',
    dimensions: { width_mm: 71.0, height_mm: 151.0 }, // Bigger than FlatScreen
    curvature: Curvature.FLAT,
    corner_radius_mm: 2.0,
    cutout_mask_svg: 'none',
    edge_coverage: EdgeCoverage.FULL_GLUE,
    cutout_alignment_offset_allowance_mm: 0.5
};

export const FlatGlassForCurved: GlassGeometry = {
    sku_code: 'flat_on_curved',
    dimensions: { width_mm: 74.0, height_mm: 162.0 },
    curvature: Curvature.FLAT, // Mismatch
    corner_radius_mm: 3.0,
    cutout_mask_svg: 'none',
    edge_coverage: EdgeCoverage.FULL_GLUE,
    cutout_alignment_offset_allowance_mm: 0.5
};

export const BlockedSensorGlass: GlassGeometry = {
    sku_code: 'blocked_sensor',
    dimensions: { width_mm: 72.0, height_mm: 160.0 },
    curvature: Curvature.FLAT,
    corner_radius_mm: 2.5,
    cutout_mask_svg: 'none', // No hole, blocks punch hole
    edge_coverage: EdgeCoverage.FULL_GLUE,
    cutout_alignment_offset_allowance_mm: 0.5
};
