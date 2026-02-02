// src/core/matcher/confidence.ts

import { ConfidenceBreakdown } from '../geometry/types';
import { GeometryMath } from '../geometry/geometryMath';

export const ConfidenceScorer = {
    calculate(
        baseScore: number,
        geometryPenaltyCoef: number, // 0..1 scale of how bad the dimension fit is
        isNative: boolean,
        cutoutPenalty: number,
        curvaturePenalty: number
    ): { score: number; breakdown: ConfidenceBreakdown } {

        // Configurable weights
        const GEOMETRY_WEIGHT = 0.20; // Max penalty for dimensions

        const breakdown: ConfidenceBreakdown = {
            id_match: isNative ? 1.0 : 0.0,
            geometry_penalty: -1 * (geometryPenaltyCoef * GEOMETRY_WEIGHT),
            cutout_penalty: -1 * cutoutPenalty,
            curvature_penalty: -1 * curvaturePenalty,
            verification_bonus: 0.0 // To be added by external verification logic if needed
        };

        let total = baseScore
            + breakdown.geometry_penalty
            + breakdown.cutout_penalty
            + breakdown.curvature_penalty
            + breakdown.verification_bonus;

        return {
            score: GeometryMath.clamp(total, 0.0, 1.0),
            breakdown
        };
    }
};
