// src/core/__tests__/rejection.spec.ts
import { StrictGeometryMatcher } from '../matcher/StrictGeometryMatcher';
import { CurvedScreen, FlatScreen, PunchHoleScreen } from './fixtures/screens';
import { FlatGlassForCurved, OversizeGlass, BlockedSensorGlass, UndersizeGlass } from './fixtures/glass';
import { MatchStatus } from '../geometry/types';

describe('StrictGeometryMatcher - Hard Rejections', () => {
    it('should REJECT flat glass on curved screen', () => {
        const result = StrictGeometryMatcher.match(CurvedScreen, FlatGlassForCurved);

        expect(result.status).toBe(MatchStatus.INCOMPATIBLE);
        expect(result.confidence).toBe(0.0);
        expect(result.rejection_reasons).toContain('Cannot put Flat Glass on Curved Screen (Lifting/Halo Risk)');
    });

    it('should REJECT oversized glass', () => {
        const result = StrictGeometryMatcher.match(FlatScreen, OversizeGlass);

        expect(result.status).toBe(MatchStatus.INCOMPATIBLE);
        // Oversize glass width 71 > screen 70 (max oversize 0.0)
        expect(result.rejection_reasons.some(r => r.includes('Glass width too large'))).toBe(true);
    });

    it('should REJECT undersized glass beyond tolerance', () => {
        // UndersizeGlass width 65 vs screen 70. Delta -5. Tolerance min_undersize 2.0
        const result = StrictGeometryMatcher.match(FlatScreen, UndersizeGlass);

        expect(result.status).toBe(MatchStatus.INCOMPATIBLE);
        expect(result.rejection_reasons.some(r => r.includes('Glass width too narrow'))).toBe(true);
    });

    it('should REJECT glass that blocks sensor', () => {
        const result = StrictGeometryMatcher.match(PunchHoleScreen, BlockedSensorGlass);

        expect(result.status).toBe(MatchStatus.INCOMPATIBLE);
        expect(result.rejection_reasons).toContain('Glass blocks screen sensor (No Cutout)');
    });
});
