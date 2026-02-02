// src/core/matcher/StrictGeometryMatcher.ts

import {
    ScreenGeometry,
    GlassGeometry,
    MatchResult,
    MatchStatus,
    UniversalRule
} from '../geometry/types';
import { ToleranceChecker } from '../geometry/tolerances';
import { HardRules } from './rules';
import { ConfidenceScorer } from './confidence';

export class StrictGeometryMatcher {

    /**
     * Pure Deterministic Matcher.
     * Takes Geometry -> Returns Compatibility Decision.
     */
    static match(
        screen: ScreenGeometry,
        glass: GlassGeometry,
        universalRule?: UniversalRule
    ): MatchResult {
        const warnings: string[] = [];
        const rejections: string[] = [];

        // 1. HARD FILTERS (The "Red" Zone)

        // A. Curvature Logic
        const curvatureCheck = HardRules.checkCurvature(screen, glass);
        if (!curvatureCheck.passed) {
            rejections.push(curvatureCheck.reason!);
        }

        // B. Cutout Logic (SVG Intersection)
        // If Universal Rule exists, we skip cutout checks (human verified).
        if (!universalRule) {
            const cutoutCheck = HardRules.checkCutout(screen, glass);
            if (!cutoutCheck.passed) {
                rejections.push(cutoutCheck.reason!);
            }
        }

        // C. Dimensions & Tolerances
        // If a Universal Rule exists, we TRUST the rule and SKIP strict geometric tolerance checks.
        // The rule implies manual verification that overrides physical delta limits.
        let dimCheck: { passed: boolean; reason?: string; penaltyCoef: number } = { passed: true, reason: undefined, penaltyCoef: 0 };

        if (!universalRule) {
            dimCheck = ToleranceChecker.checkDimensions(screen, glass);
            if (!dimCheck.passed) {
                rejections.push(dimCheck.reason!);
            }
        }

        // --- STOP IF REJECTED ---
        if (rejections.length > 0) {
            return {
                status: MatchStatus.INCOMPATIBLE,
                confidence: 0.0,
                confidence_breakdown: {
                    id_match: 0, geometry_penalty: 0, cutout_penalty: 0, curvature_penalty: 0, verification_bonus: 0
                },
                warnings: [],
                rejection_reasons: rejections,
                metadata: { is_native: false, computed_at: new Date() } // Date is pure here, instant created
            };
        }

        // 2. CATEGORIZATION & SCORING (Green/Yellow Zone)

        const isNative = (screen.id === glass.sku_code); // Simplified Native Check (Logic usually relies on map, here we treat SKU code overlap or provided rule)
        // Correction: In proper input, we don't know if it's native just by IDs unless caller tells us. 
        // We will infer "EXACT" intent if no universal rule is provided AND it passed all exact tolerances.
        // Actually, the Caller usually determines if they are checking a "Known Exact" candidate or a "Universal" candidate.
        // But the prompt demands the ENGINE decides based on rules.

        // Rule: Universal Rule existence implies UNIVERSAL intent.
        // Rule: Native ID Match implies EXACT intent (but we rely on geometry to confirm).

        let status = MatchStatus.UNIVERSAL;
        let baseConfidence = 0.6; // Default Universal Floor

        if (!universalRule) {
            // If no universal rule provided, we assume we are testing a "supposedly" exact candidate
            status = MatchStatus.EXACT;
            baseConfidence = 1.0;
        } else {
            // It's governed by a universal rule
            status = MatchStatus.UNIVERSAL;
            baseConfidence = universalRule.fit_score / 100;
            if (universalRule.warnings) warnings.push(...universalRule.warnings);
        }

        // 3. Downgrades
        // Even if status is EXACT, if geometry wasn't perfect (but passed tolerance), we penalize.

        const { score, breakdown } = ConfidenceScorer.calculate(
            baseConfidence,
            dimCheck.penaltyCoef,
            (status === MatchStatus.EXACT),
            0.0, // Cutout penalty (binary reject implemented, so 0 if passed)
            0.0  // Curvature penalty (binary reject implemented)
        );

        // Final Status Override: If confidence drops too low, it might be safer to call it Universal even if intended Exact?
        // No, keep status but lower confidence.

        return {
            status,
            confidence: score,
            confidence_breakdown: breakdown,
            warnings,
            rejection_reasons: [],
            metadata: {
                is_native: (status === MatchStatus.EXACT),
                computed_at: new Date()
            }
        };
    }
}
