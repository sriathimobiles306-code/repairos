// src/core/__tests__/universalMatch.spec.ts
import { StrictGeometryMatcher } from '../matcher/StrictGeometryMatcher';
import { FlatScreen } from './fixtures/screens';
import { UniversalGlassValid } from './fixtures/glass';
import { ValidUniversalRule } from './fixtures/universalRules';
import { MatchStatus } from '../geometry/types';

describe('StrictGeometryMatcher - Universal Match', () => {
    it('should return UNIVERSAL status when rule is provided', () => {
        const result = StrictGeometryMatcher.match(FlatScreen, UniversalGlassValid, ValidUniversalRule);

        expect(result.status).toBe(MatchStatus.UNIVERSAL);
        expect(result.confidence).toBeLessThan(1.0);
        expect(result.confidence).toBeGreaterThan(0.8); // fit_score 90 -> 0.9 base +- penalties
        expect(result.confidence_breakdown.id_match).toBe(0.0);
        expect(result.warnings).toContain('Gap on edges 0.25mm');
    });

    it('should penalize confidence for size differences', () => {
        const result = StrictGeometryMatcher.match(FlatScreen, UniversalGlassValid, ValidUniversalRule);
        // Glass is 0.5mm smaller width -> penalty expected
        expect(result.confidence_breakdown.geometry_penalty).toBeLessThan(0);
    });

    it('MUST NEVER return EXACT for universal candidates', () => {
        // Even if fit is great, if rule is passed, it is UNIVERSAL
        const result = StrictGeometryMatcher.match(FlatScreen, UniversalGlassValid, ValidUniversalRule);
        expect(result.status).not.toBe(MatchStatus.EXACT);
    });
});
