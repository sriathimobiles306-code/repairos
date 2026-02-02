// src/core/geometry/svgMask.ts

/**
 * Standardized representation of a cutout zone in 0..1 normalized space.
 * For this engine, we abstract SVG parsing into "Keep-out Zones" (Screen) and "Safe Holes" (Glass).
 * In a real computation, this would parse the SVG path. Here we assume a parsed intermediate representation
 * or implement logic to parse basic rects/circles from the path string.
 */

export interface NormalizedZone {
    type: 'rect' | 'circle';
    x: number; // 0..1 Center X
    y: number; // 0..1 Center Y
    w_r: number; // Width or Radius (normalized)
    h: number; // Height (normalized, ignored for circle)
}

export const SvgMaskParams = {
    // Epsilon for "Close enough" alignment
    ALIGNMENT_EPSILON: 0.02, // 2% of screen dimension
};

export const SvgMaskMath = {
    /**
     * Checks if the glass cutout (hole) properly exposes the screen sensor (keep-out zone).
     * @param screenKeepOut The area on the screen that MUST be uncovered (Sensor/Camera).
     * @param glassHole The area on the glass that is Cut Out (Empty).
     * @returns TRUE if the Keep-Out zone is fully contained within the Glass Hole (Safe).
     */
    doesHoleExposeSensor(screenKeepOut: NormalizedZone, glassHole: NormalizedZone): boolean {
        // Simplified Logic: Check if Sensor Bounding Box is inside Hole
        // In production, this would use full path intersection.

        // 1. alignment check
        const dist = Math.sqrt(Math.pow(screenKeepOut.x - glassHole.x, 2) + Math.pow(screenKeepOut.y - glassHole.y, 2));

        // If the sensor is defined, but the hole is too far away, REJECT.
        if (dist > SvgMaskParams.ALIGNMENT_EPSILON) {
            return false;
        }

        // 2. Size check
        // The hole must be at least as big as the sensor
        if (glassHole.w_r < screenKeepOut.w_r) {
            return false;
        }

        return true;
    },

    /**
     * Parses a simplified SVG path string into a zone.
     * Supports specific simple formats like "circle(cx,cy,r)" or "rect(x,y,w,h)"
     * for deterministic MVP. Real SVG parsing would depend on a library, avoided here for 'No Dependencies'.
     */
    parseZone(svgString: string): NormalizedZone | null {
        if (!svgString || svgString === 'none') return null;

        // Mock parser for MVP demonstration of logic flow
        // Expected format: "circle(0.5, 0.05, 0.02)"
        const circleMatch = svgString.match(/circle\(([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/);
        if (circleMatch) {
            return {
                type: 'circle',
                x: parseFloat(circleMatch[1]),
                y: parseFloat(circleMatch[2]),
                w_r: parseFloat(circleMatch[3]),
                h: 0
            };
        }

        const rectMatch = svgString.match(/rect\(([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/);
        if (rectMatch) {
            return {
                type: 'rect',
                x: parseFloat(rectMatch[1]),
                y: parseFloat(rectMatch[2]),
                w_r: parseFloat(rectMatch[3]),
                h: parseFloat(rectMatch[4])
            };
        }

        return null;
    }
};
