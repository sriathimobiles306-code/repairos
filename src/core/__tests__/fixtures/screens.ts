// src/core/__tests__/fixtures/screens.ts
import { ScreenGeometry, Curvature } from '../../geometry/types';

export const FlatScreen: ScreenGeometry = {
    id: 'screen_flat_01',
    dimensions: { width_mm: 70.0, height_mm: 150.0 },
    active_area: { width_mm: 68.0, height_mm: 148.0 },
    curvature: Curvature.FLAT,
    corner_radius_mm: 2.0,
    cutout_mask_svg: 'none',
    fit_tolerances: { max_oversize_mm: 0.0, min_undersize_mm: 2.0, allowed_misalignment_mm: 0.5 }
};

export const PunchHoleScreen: ScreenGeometry = {
    id: 'screen_ph_01',
    dimensions: { width_mm: 72.0, height_mm: 160.0 },
    active_area: { width_mm: 71.0, height_mm: 159.0 },
    curvature: Curvature.FLAT,
    corner_radius_mm: 2.5,
    cutout_mask_svg: 'circle(0.5, 0.1, 0.05)', // Center top
    fit_tolerances: { max_oversize_mm: 0.0, min_undersize_mm: 2.0, allowed_misalignment_mm: 0.5 }
};

export const CurvedScreen: ScreenGeometry = {
    id: 'screen_curved_01',
    dimensions: { width_mm: 74.0, height_mm: 162.0 },
    active_area: { width_mm: 74.0, height_mm: 162.0 }, // Edge to edge active
    curvature: Curvature.CURVED_3D,
    corner_radius_mm: 3.0,
    cutout_mask_svg: 'none',
    fit_tolerances: { max_oversize_mm: 0.0, min_undersize_mm: 1.5, allowed_misalignment_mm: 0.5 }
};
