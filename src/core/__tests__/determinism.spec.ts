// src/core/__tests__/determinism.spec.ts
import { StrictGeometryMatcher } from '../matcher/StrictGeometryMatcher';
import { FlatScreen } from './fixtures/screens';
import { UniversalGlassValid } from './fixtures/glass';
import { ValidUniversalRule } from './fixtures/universalRules';

describe('StrictGeometryMatcher - Determinism', () => {
    it('should return identical logic results (excluding timestamp) for 10 sequential runs', () => {
        const results: any[] = [];

        for (let i = 0; i < 10; i++) {
            // We strip the variable metadata for the determinism check
            const { metadata, ...rest } = StrictGeometryMatcher.match(FlatScreen, UniversalGlassValid, ValidUniversalRule);
            results.push(rest);
        }

        const firstResultStr = JSON.stringify(results[0]);

        for (let i = 1; i < 10; i++) {
            const currentResultStr = JSON.stringify(results[i]);
            expect(currentResultStr).toBe(firstResultStr);
        }
    });
});
