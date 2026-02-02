// src/core/geometry/geometryMath.ts

import { ScreenGeometry, GlassGeometry } from './types';

export const GeometryMath = {
    /**
     * Calculates the difference in dimensions between glass and screen.
     * Positive = Glass is larger (Oversize)
     * Negative = Glass is smaller (Undersize)
     */
    calculateDelta(screen: ScreenGeometry, glass: GlassGeometry): { width_delta: number; height_delta: number } {
        return {
            width_delta: glass.dimensions.width_mm - screen.dimensions.width_mm,
            height_delta: glass.dimensions.height_mm - screen.dimensions.height_mm,
        };
    },

    /**
     * Checks if the glass corner radius is compatible with the screen.
     * If glass radius is significantly smaller than screen radius, it might leave corners exposed (functional risk).
     * If glass radius is larger, it might overhang (visual risk).
     */
    checkCornerRadius(screenRadius: number, glassRadius: number, epsilon: number = 0.5): boolean {
        // Glass radius should generally follow screen radius.
        // Strict check: abs diff <= epsilon
        return Math.abs(screenRadius - glassRadius) <= epsilon;
    },

    /**
     * Clamps a value between min and max.
     */
    clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(value, min), max);
    }
};
