// src/core/__tests__/exactMatch.spec.ts
import { StrictGeometryMatcher } from '../matcher/StrictGeometryMatcher';
import { FlatScreen, PunchHoleScreen } from './fixtures/screens';
import { ExactGlassFlat, ExactGlassPunchHole } from './fixtures/glass';
import { MatchStatus } from '../geometry/types';

describe('StrictGeometryMatcher - Exact Match', () => {
    it('should return EXACT status for identical geometry', () => {
        const result = StrictGeometryMatcher.match(FlatScreen, ExactGlassFlat);

        expect(result.status).toBe(MatchStatus.EXACT);
        expect(result.confidence).toBe(1.0);
        expect(result.confidence_breakdown.id_match).toBe(1.0);
        expect(result.warnings.length).toBe(0);
        expect(result.rejection_reasons.length).toBe(0);
    });

    it('should return EXACT status for matching punch hole geometry', () => {
        const result = StrictGeometryMatcher.match(PunchHoleScreen, ExactGlassPunchHole);

        expect(result.status).toBe(MatchStatus.EXACT);
        expect(result.confidence).toBe(1.0);
        expect(result.confidence_breakdown.cutout_penalty).toBe(0);
    });
});
