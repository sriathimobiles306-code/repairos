// src/core/geometry/tolerances.ts

import { ScreenGeometry, GlassGeometry, ToleranceConfig } from './types';
import { GeometryMath } from './geometryMath';

export const ToleranceChecker = {
    checkDimensions(screen: ScreenGeometry, glass: GlassGeometry): { passed: boolean; reason?: string; penaltyCoef: number } {
        const delta = GeometryMath.calculateDelta(screen, glass);
        const rules: ToleranceConfig = screen.fit_tolerances;

        // 1. Oversize Check (Critical)
        // If glass is WIDER or TALLER than tolerance allows -> REJECT (Hanging edges, lifting)
        if (delta.width_delta > rules.max_oversize_mm) {
            return {
                passed: false,
                reason: `Glass width too large (+${delta.width_delta.toFixed(2)}mm > max +${rules.max_oversize_mm}mm)`,
                penaltyCoef: 1.0
            };
        }
        if (delta.height_delta > rules.max_oversize_mm) {
            return {
                passed: false,
                reason: `Glass height too large (+${delta.height_delta.toFixed(2)}mm > max +${rules.max_oversize_mm}mm)`,
                penaltyCoef: 1.0
            };
        }

        // 2. Undersize Check (Functional)
        // If glass is TOO SMALL -> REJECT (Leaves too much active area exposed)
        // Note: tolerance.min_undersize_mm is usually a positive number representing "Max negative delta allowed" (e.g. 2.0mm)
        // So if delta is -3.0mm, and min_undersize is 2.0mm, we reject.
        if (Math.abs(delta.width_delta) > rules.min_undersize_mm && delta.width_delta < 0) {
            return {
                passed: false,
                reason: `Glass width too narrow (${delta.width_delta.toFixed(2)}mm < -${rules.min_undersize_mm}mm)`,
                penaltyCoef: 1.0
            };
        }
        if (Math.abs(delta.height_delta) > rules.min_undersize_mm && delta.height_delta < 0) {
            return {
                passed: false,
                reason: `Glass height too short (${delta.height_delta.toFixed(2)}mm < -${rules.min_undersize_mm}mm)`,
                penaltyCoef: 1.0
            };
        }

        // 3. Penalty Calculation (Soft Fit)
        // Perfect fit (delta 0) = 0 penalty.
        // Max allowable undersize = Max penalty.
        const widthPenalty = Math.abs(delta.width_delta) / (rules.min_undersize_mm || 1);
        const heightPenalty = Math.abs(delta.height_delta) / (rules.min_undersize_mm || 1);

        return { passed: true, penaltyCoef: (widthPenalty + heightPenalty) / 2 };
    }
};
