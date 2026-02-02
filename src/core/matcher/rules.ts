// src/core/matcher/rules.ts

import { ScreenGeometry, GlassGeometry, Curvature } from '../geometry/types';
import { SvgMaskMath } from '../geometry/svgMask';

export const HardRules = {
    checkCurvature(screen: ScreenGeometry, glass: GlassGeometry): { passed: boolean; reason?: string } {
        // 1. Flat on Curved -> REJECT
        if ((screen.curvature === Curvature.CURVED_3D || screen.curvature === Curvature.FOLDABLE)
            && glass.curvature === Curvature.FLAT) {
            return { passed: false, reason: 'Cannot put Flat Glass on Curved Screen (Lifting/Halo Risk)' };
        }

        // 2. 2.5D on Curved -> REJECT (Usually)
        if (screen.curvature === Curvature.CURVED_3D && glass.curvature === Curvature.TWO_POINT_FIVE_D) {
            return { passed: false, reason: '2.5D Glass insufficient for 3D Curved Screen' };
        }

        // 3. Curved on Flat -> REJECT (Rare but wrong)
        if (screen.curvature === Curvature.FLAT && glass.curvature === Curvature.CURVED_3D) {
            return { passed: false, reason: 'Curved Glass on Flat Screen (Edge Mismatch)' };
        }

        return { passed: true };
    },

    checkCutout(screen: ScreenGeometry, glass: GlassGeometry): { passed: boolean; reason?: string } {
        const screenZone = SvgMaskMath.parseZone(screen.cutout_mask_svg);
        const glassHole = SvgMaskMath.parseZone(glass.cutout_mask_svg);

        // If screen has NO sensor zone, it is conceptually safe (glass can be solid or have hole).
        if (!screenZone) return { passed: true };

        // If screen HAS sensor zone, but Glass HAS NO hole -> REJECT (Blocked Sensor).
        // (Unless we have some "transparent glass" logic, but assumed blocked for now)
        if (!glassHole) {
            return { passed: false, reason: 'Glass blocks screen sensor (No Cutout)' };
        }

        // Check geometric containment
        if (!SvgMaskMath.doesHoleExposeSensor(screenZone, glassHole)) {
            return { passed: false, reason: 'Glass cutout misaligned or too small for sensor' };
        }

        return { passed: true };
    }
};
