// src/core/__tests__/fixtures/universalRules.ts
import { UniversalRule } from '../../geometry/types';

export const ValidUniversalRule: UniversalRule = {
    target_screen_id: 'screen_flat_01',
    source_screen_id: 'univ_01',
    fit_score: 90,
    is_safe: true,
    warnings: ['Gap on edges 0.25mm']
};

export const UnsafeRule: UniversalRule = {
    target_screen_id: 'screen_flat_01',
    source_screen_id: 'univ_unsafe',
    fit_score: 80,
    is_safe: false,
    warnings: ['Covers proximity sensor']
};
