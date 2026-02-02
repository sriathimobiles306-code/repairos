
import { ScreenGeometry, MatchResult, MatchStatus } from '../../core/geometry/types';

export interface DisplayProfile extends ScreenGeometry {
    display_resolution: string; // "1080x2400"
    connection_type: string;    // "FPC_SAMS_A54_V1"
    panel_technology: string;   // "OLED"
    refresh_rate_hz: number;    // 120
}

export class DisplayMatcher {

    /**
     * Determines if a Donor Screen (Source) works on a Target Device.
     * displayMatch(target, donor)
     */
    static match(target: DisplayProfile, donor: DisplayProfile): MatchResult {
        const warnings: string[] = [];

        // 1. CRITICAL: Connector Type MUST Match
        // If connectors are different, it creates a short circuit -> Incompatible.
        if (target.connection_type !== donor.connection_type) {
            return {
                status: MatchStatus.INCOMPATIBLE,
                confidence: 0,
                confidence_breakdown: zeroBreakdown(),
                warnings: [],
                rejection_reasons: [`Connector Mismatch: Target uses ${target.connection_type}, Donor uses ${donor.connection_type}`],
                metadata: { is_native: false, computed_at: new Date() }
            };
        }

        // 2. CRITICAL: Dimensions (Housing Fit)
        // Donor must Fit inside Target Housing.
        // It can be slightly smaller (gap), but NOT larger.
        const widthDelta = donor.dimensions.width_mm - target.dimensions.width_mm;
        const heightDelta = donor.dimensions.height_mm - target.dimensions.height_mm;

        if (widthDelta > 0.5 || heightDelta > 0.5) {
            return {
                status: MatchStatus.INCOMPATIBLE,
                confidence: 0,
                confidence_breakdown: zeroBreakdown(),
                warnings: [],
                rejection_reasons: [`Donor screen too large for housing (W:+${widthDelta.toFixed(2)}mm, H:+${heightDelta.toFixed(2)}mm)`],
                metadata: { is_native: false, computed_at: new Date() }
            };
        }

        // 3. COMPATIBILITY CHECKS (Downgrades)

        let confidence = 1.0;

        // Resolution Mismatch?
        if (target.display_resolution !== donor.display_resolution) {
            warnings.push(`Resolution Mismatch: Target ${target.display_resolution}, Donor ${donor.display_resolution}. Image may be scaled or cropped.`);
            confidence -= 0.3; // Major penalty
        }

        // Refresh Rate Downgrade?
        if (donor.refresh_rate_hz < target.refresh_rate_hz) {
            warnings.push(`Refresh Rate Downgrade: Target expects ${target.refresh_rate_hz}Hz, Donor is ${donor.refresh_rate_hz}Hz.`);
            confidence -= 0.1;
        }

        // Panel Tech Upgrade/Downgrade?
        if (target.panel_technology === 'OLED' && donor.panel_technology === 'IPS') {
            warnings.push(`Technology Downgrade: Target expects OLED, Donor is IPS (Thicker/Lower Quality).`);
            confidence -= 0.2;
        }

        return {
            status: confidence > 0.8 ? MatchStatus.EXACT : MatchStatus.UNIVERSAL,
            confidence,
            confidence_breakdown: {
                id_match: target.id === donor.id ? 1 : 0,
                geometry_penalty: 0,
                cutout_penalty: 0,
                curvature_penalty: 0,
                verification_bonus: 0
            },
            warnings,
            rejection_reasons: [],
            metadata: { is_native: (target.id === donor.id), computed_at: new Date() }
        };
    }
}

function zeroBreakdown() {
    return { id_match: 0, geometry_penalty: 0, cutout_penalty: 0, curvature_penalty: 0, verification_bonus: 0 };
}
