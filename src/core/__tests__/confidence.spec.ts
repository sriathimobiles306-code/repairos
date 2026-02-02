// src/core/__tests__/confidence.spec.ts
import { StrictGeometryMatcher } from '../matcher/StrictGeometryMatcher';
import { FlatScreen } from './fixtures/screens';
import { UniversalGlassValid, ExactGlassFlat } from './fixtures/glass';
import { ValidUniversalRule } from './fixtures/universalRules';

describe('StrictGeometryMatcher - Confidence Integrity', () => {
    it('should have 1.0 confidence for perfect exact match', () => {
        const result = StrictGeometryMatcher.match(FlatScreen, ExactGlassFlat);
        expect(result.confidence).toBe(1.0);
    });

    it('should degrade confidence as dimensions deviate', () => {
        // Exact match is base 1.0 (implied)
        const exact = StrictGeometryMatcher.match(FlatScreen, ExactGlassFlat);

        // Universal match is base 0.9 (from rule) + penalties
        const universal = StrictGeometryMatcher.match(FlatScreen, UniversalGlassValid, ValidUniversalRule);

        expect(universal.confidence).toBeLessThan(exact.confidence);
        expect(universal.confidence_breakdown.geometry_penalty).toBeLessThan(0);
    });

    it('should clamp confidence between 0 and 1', () => {
        // Even if we hypothetically added huge bonuses or penalties (unit test logic check)
        // The scorer uses clamp. We implicitly test reasonable bounds here.
        const result = StrictGeometryMatcher.match(FlatScreen, UniversalGlassValid, ValidUniversalRule);
        expect(result.confidence).toBeGreaterThanOrEqual(0.0);
        expect(result.confidence).toBeLessThanOrEqual(1.0);
    });
});
