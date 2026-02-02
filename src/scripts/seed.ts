// src/scripts/seed.ts
import { Pool } from 'pg';
import * as crypto from 'crypto';

/**
 * STRICT SEED SCRIPT
 * Follows Frozen Schema Rules:
 * - No manual IDs for SERIAL columns
 * - Deterministic Geometry Hashing
 * - Immutability (ON CONFLICT DO NOTHING for Screens)
 * - Correct Billing Schema
 */

const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
};

const pool = new Pool(DB_CONFIG);

// --- HELPER: Geometry Hashing ---
function computeGeometryHash(geo: any): string {
    // Sort keys to ensure deterministic output
    const stablePayload = {
        width: Number(geo.width_mm).toFixed(2),
        height: Number(geo.height_mm).toFixed(2),
        active_w: Number(geo.active_area_width_mm).toFixed(2),
        active_h: Number(geo.active_area_height_mm).toFixed(2),
        corners: Number(geo.corner_radius_mm).toFixed(2),
        curvature: geo.curved_type,
        cutout: geo.cutout_mask_svg
    };

    return crypto.createHash('sha256')
        .update(JSON.stringify(stablePayload))
        .digest('hex');
}

async function seed() {
    const client = await pool.connect();
    try {
        console.log('🌱 Starting Strict Seed Process...');
        await client.query('BEGIN');

        // ---------------------------------------------------------
        // 1. BRANDS (Idempotent)
        // ---------------------------------------------------------
        const brandNames = ['Samsung', 'Apple', 'Xiaomi', 'Redmi', 'Realme', 'Oppo', 'Vivo', 'Poco', 'Google', 'Nothing'];
        const brandMap = new Map<string, string>(); // Name -> ID

        for (const name of brandNames) {
            let res = await client.query(`
                INSERT INTO brands (name, slug, is_active, created_by_role)
                VALUES ($1, $2, TRUE, 'SYSTEM')
                ON CONFLICT (name) DO NOTHING
                RETURNING id
            `, [name, name.toLowerCase()]);

            if (res.rows.length === 0) {
                res = await client.query(`SELECT id FROM brands WHERE name = $1`, [name]);
            }
            brandMap.set(name, res.rows[0].id);
        }
        console.log(`✅ Brands: ${brandNames.length} synced.`);

        // ---------------------------------------------------------
        // 2. SCREENS (Immutable Atoms)
        // ---------------------------------------------------------

        const screenDefs = [
            // A. iPhone 13/14 (6.1 Flat Notch)
            {
                name: 'iphone_13_14',
                diagonal: 6.06,
                w: 71.50, h: 146.70,
                aw: 69.00, ah: 144.00,
                curve: 'FLAT', corner: 4.00,
                shape: 'notch_wide', svg: 'M0,0 H1 V1 H0 Z',
                tol: { max_oversize: 0.0, min_undersize: 1.5 }
            },
            // B. Samsung A54 (6.4 Flat Punch)
            {
                name: 'sam_a54',
                diagonal: 6.40,
                w: 76.70, h: 158.20,
                aw: 70.00, ah: 151.00,
                curve: 'FLAT', corner: 3.50,
                shape: 'punch_hole_center', svg: 'M0.5,0.05 m-0.02,0 a0.02,0.02 0 1,0 0.04,0 a0.02,0.02 0 1,0 -0.04,0',
                tol: { max_oversize: 0.0, min_undersize: 2.0 }
            },
            // C. Redmi Note 12 (6.67 Flat Punch)
            {
                name: 'redmi_note12',
                diagonal: 6.67,
                w: 76.21, h: 165.88,
                aw: 73.00, ah: 162.00,
                curve: 'FLAT', corner: 3.00,
                shape: 'punch_hole_center', svg: 'M0.5,0.06 m-0.02,0 a0.02,0.02 0 1,0 0.04,0 a0.02,0.02 0 1,0 -0.04,0',
                tol: { max_oversize: 0.0, min_undersize: 2.5 }
            },
            // D. Pixel 7 (6.3 Flat Punch)
            {
                name: 'pixel_7',
                diagonal: 6.30,
                w: 73.20, h: 155.60,
                aw: 70.00, ah: 150.00,
                curve: 'FLAT', corner: 2.50,
                shape: 'punch_hole_center', svg: 'M0.5,0.05 m-0.02,0 a0.02,0.02 0 1,0 0.04,0 a0.02,0.02 0 1,0 -0.04,0',
                tol: { max_oversize: 0.0, min_undersize: 1.5 }
            },
            // E. Nothing Phone 1 (6.55 Flat Punch Left)
            {
                name: 'nothing_1',
                diagonal: 6.55,
                w: 75.80, h: 159.20,
                aw: 72.00, ah: 155.00,
                curve: 'FLAT', corner: 3.00,
                shape: 'punch_hole_left', svg: 'M0.1,0.05 m-0.02,0 a0.02,0.02 0 1,0 0.04,0 a0.02,0.02 0 1,0 -0.04,0',
                tol: { max_oversize: 0.0, min_undersize: 2.0 }
            },
            // F. Realme 9 Pro+ (6.4 Flat Punch Left) - Good fit for A54
            {
                name: 'realme_9_pro_plus',
                diagonal: 6.40,
                w: 73.30, h: 160.20,
                aw: 70.00, ah: 151.00, // Matches A54 Active Area width
                curve: 'FLAT', corner: 3.00,
                shape: 'punch_hole_left', svg: 'M0.1,0.05 m-0.02,0 a0.02,0.02 0 1,0 0.04,0 a0.02,0.02 0 1,0 -0.04,0',
                tol: { max_oversize: 0.0, min_undersize: 2.0 }
            },
            // G. Oppo F21 Pro (6.43 Flat Punch Left)
            {
                name: 'oppo_f21_pro',
                diagonal: 6.43,
                w: 73.20, h: 159.90,
                aw: 70.00, ah: 151.00,
                curve: 'FLAT', corner: 2.80,
                shape: 'punch_hole_left', svg: 'M0.1,0.05 m-0.02,0 a0.02,0.02 0 1,0 0.04,0 a0.02,0.02 0 1,0 -0.04,0',
                tol: { max_oversize: 0.0, min_undersize: 2.0 }
            },
            // --- UNIVERSAL SOURCES ---
            // Generic 6.4 (Fits A54, Pixel 7)
            {
                name: 'generic_6_4',
                diagonal: 6.40,
                w: 70.00, h: 150.00,
                aw: 70.00, ah: 150.00,
                curve: 'FLAT', corner: 2.00,
                shape: 'none', svg: 'M0,0',
                tol: { max_oversize: 0.0, min_undersize: 2.0 }
            },
            // Generic 6.5 (Fits Nothing 1, various others)
            {
                name: 'generic_6_5',
                diagonal: 6.50,
                w: 72.00, h: 155.00,
                aw: 72.00, ah: 155.00,
                curve: 'FLAT', corner: 2.00,
                shape: 'none', svg: 'M0,0',
                tol: { max_oversize: 0.0, min_undersize: 2.0 }
            }
        ];

        const screenMap = new Map<string, string>(); // Name -> ID

        for (const s of screenDefs) {
            const dbRow = {
                diagonal_inch: s.diagonal,
                width_mm: s.w,
                height_mm: s.h,
                active_area_width_mm: s.aw,
                active_area_height_mm: s.ah,
                curved_type: s.curve,
                corner_radius_mm: s.corner,
                cutout_shape: s.shape,
                cutout_mask_svg: s.svg,
                fit_tolerances: JSON.stringify(s.tol),
                created_by_role: 'SYSTEM'
            };

            const hash = computeGeometryHash(dbRow);

            let res = await client.query(`
                INSERT INTO screens (
                    geometry_hash, diagonal_inch, width_mm, height_mm,
                    active_area_width_mm, active_area_height_mm,
                    curved_type, corner_radius_mm,
                    cutout_shape, cutout_mask_svg, fit_tolerances, created_by_role
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (geometry_hash) DO NOTHING
                RETURNING id
            `, [
                hash, dbRow.diagonal_inch, dbRow.width_mm, dbRow.height_mm,
                dbRow.active_area_width_mm, dbRow.active_area_height_mm,
                dbRow.curved_type, dbRow.corner_radius_mm,
                dbRow.cutout_shape, dbRow.cutout_mask_svg, dbRow.fit_tolerances, dbRow.created_by_role
            ]);

            if (res.rows.length === 0) {
                res = await client.query(`SELECT id FROM screens WHERE geometry_hash = $1`, [hash]);
            }
            screenMap.set(s.name, res.rows[0].id);
        }
        console.log(`✅ Screens: ${screenDefs.length} synced.`);

        // ---------------------------------------------------------
        // 3. MODELS & MAPPINGS
        // ---------------------------------------------------------
        const mappings = [
            { brand: 'Apple', name: 'iPhone 13', screenKey: 'iphone_13_14', release: '2021-09-24' },
            { brand: 'Apple', name: 'iPhone 14', screenKey: 'iphone_13_14', release: '2022-09-16' },
            { brand: 'Samsung', name: 'Galaxy A54 5G', screenKey: 'sam_a54', release: '2023-03-24' },
            { brand: 'Redmi', name: 'Note 12 5G', screenKey: 'redmi_note12', release: '2023-01-11' },
            { brand: 'Poco', name: 'X5 5G', screenKey: 'redmi_note12', release: '2023-02-07' },
            { brand: 'Google', name: 'Pixel 7', screenKey: 'pixel_7', release: '2022-10-06' },
            { brand: 'Nothing', name: 'Phone (1)', screenKey: 'nothing_1', release: '2022-07-16' },
            { brand: 'Realme', name: '9 Pro+', screenKey: 'realme_9_pro_plus', release: '2022-02-16' },
            { brand: 'Oppo', name: 'F21 Pro', screenKey: 'oppo_f21_pro', release: '2022-04-12' }
        ];

        for (const m of mappings) {
            const brandId = brandMap.get(m.brand);
            if (!brandId) continue;

            // Insert Model
            let modRes = await client.query(`
                INSERT INTO mobile_models (brand_id, name, release_date, created_by_role)
                VALUES ($1, $2, $3, 'SYSTEM')
                ON CONFLICT (brand_id, name) DO NOTHING
                RETURNING id
            `, [brandId, m.name, m.release]);

            if (modRes.rows.length === 0) {
                modRes = await client.query(`
                    SELECT id FROM mobile_models WHERE brand_id = $1 AND name = $2
                `, [brandId, m.name]);
            }
            const modelId = modRes.rows[0].id;
            const screenId = screenMap.get(m.screenKey);

            // Upsert Mapping
            await client.query(`
                INSERT INTO model_screen_map (
                    model_id, screen_id, confidence_score, verification_source, 
                    is_active, valid_from, created_by_role
                ) VALUES ($1, $2, 1.0, 'SPEC_SHEET', TRUE, NOW(), 'SYSTEM')
                ON CONFLICT (model_id) WHERE is_active = TRUE DO NOTHING
            `, [modelId, screenId]);
        }
        console.log(`✅ Models & Mappings: ${mappings.length} synced.`);

        // ---------------------------------------------------------
        // 4. GLASS SKUS
        // ---------------------------------------------------------
        const skus = [
            // Exacts
            { code: 'GLS-IP13', screenKey: 'iphone_13_14', w: 71.3, h: 146.5, name: '9D Glass iPhone 13/14' },
            { code: 'GLS-A54', screenKey: 'sam_a54', w: 76.5, h: 158.0, name: 'OG Glass Samsung A54' },
            { code: 'GLS-NT12', screenKey: 'redmi_note12', w: 76.0, h: 165.5, name: 'Super X Note 12' },
            { code: 'GLS-PX7', screenKey: 'pixel_7', w: 73.0, h: 155.0, name: 'HD+ Pixel 7' },
            { code: 'GLS-NOT1', screenKey: 'nothing_1', w: 75.5, h: 159.0, name: 'Matte Glass Nothing 1' },
            { code: 'GLS-RM9P', screenKey: 'realme_9_pro_plus', w: 73.0, h: 160.0, name: 'Spy Glass Realme 9 Pro+' },
            { code: 'GLS-OPF21', screenKey: 'oppo_f21_pro', w: 73.0, h: 159.5, name: 'Matte Oppo F21 Pro' },

            // Universal Sources
            { code: 'GLS-UNIV-64', screenKey: 'generic_6_4', w: 70.0, h: 150.0, name: 'Universal 6.4 Inch' },
            { code: 'GLS-UNIV-65', screenKey: 'generic_6_5', w: 72.0, h: 155.0, name: 'Universal 6.5 Inch' }
        ];

        for (const k of skus) {
            const scId = screenMap.get(k.screenKey);
            await client.query(`
                INSERT INTO tempered_glass_skus (
                    sku_code, screen_id, marketing_name,
                    glass_width_mm, glass_height_mm, glass_curvature, 
                    edge_coverage, created_by_role
                )
                VALUES ($1, $2, $3, $4, $5, 'FLAT', 'FULL_GLUE', 'SYSTEM')
                ON CONFLICT (sku_code) DO NOTHING
            `, [k.code, scId, k.name, k.w, k.h]);
        }
        console.log(`✅ Glass SKUs: ${skus.length} synced.`);

        // ---------------------------------------------------------
        // 5. UNIVERSAL RULES
        // ---------------------------------------------------------
        const rules = [
            // A54 -> Univ 6.4
            { src: 'generic_6_4', target: 'sam_a54', score: 85.0, warning: 'Case Friendly' },
            // Pixel 7 -> Univ 6.4 (Fits nicely)
            { src: 'generic_6_4', target: 'pixel_7', score: 90.0, warning: 'Perfect Fit' },
            // Nothing 1 -> Univ 6.5 (Slightly smaller)
            { src: 'generic_6_5', target: 'nothing_1', score: 88.0, warning: 'Slight Gap' },

            // --- REAL MODEL ALTERNATIVES (Cross-Fitting for A54) ---
            // 1. Pixel 7 -> A54
            { src: 'pixel_7', target: 'sam_a54', score: 80.0, warning: 'Alternative: Pixel 7 (Case Friendly)' },
            // 2. Realme 9 Pro+ -> A54 (Fits well, similar width)
            { src: 'realme_9_pro_plus', target: 'sam_a54', score: 82.0, warning: 'Alternative: Realme 9 Pro+' },
            // 3. Oppo F21 Pro -> A54
            { src: 'oppo_f21_pro', target: 'sam_a54', score: 81.0, warning: 'Alternative: Oppo F21 Pro' },

            // --- REAL MODEL ALTERNATIVES (Cross-Fitting for Note 12) ---
            { src: 'nothing_1', target: 'redmi_note12', score: 85.0, warning: 'Alternative: Nothing Phone 1' },
            { src: 'realme_9_pro_plus', target: 'redmi_note12', score: 75.0, warning: 'Alternative: Realme 9 Pro+ (Narrow)' }
        ];

        for (const r of rules) {
            const sourceId = screenMap.get(r.src);
            const targetId = screenMap.get(r.target);

            await client.query(`
                INSERT INTO universal_glass_rules (
                    source_screen_id, target_screen_id, fit_score, is_safe_to_recommend, 
                    warnings, approved_at, approved_by, created_by_role
                )
                VALUES ($1, $2, $3, TRUE, ARRAY[$4], NOW(), 1, 'SYSTEM')
                ON CONFLICT (source_screen_id, target_screen_id) DO UPDATE
                SET fit_score = EXCLUDED.fit_score -- Ensure we update if exists
            `, [sourceId, targetId, r.score, r.warning]);
        }
        console.log(`✅ Universal Rules: ${rules.length} synced.`);

        // ---------------------------------------------------------
        // 6. TENANTS & SUBSCRIPTIONS
        // ---------------------------------------------------------
        // Plans
        const plans = [
            { name: 'BASIC', features: { allow_universal: false } },
            { name: 'PRO', features: { allow_universal: true } }
        ];
        const planMap = new Map<string, string>(); // Name -> ID

        for (const p of plans) {
            let res = await client.query(`
                INSERT INTO plans (tier_name, features_json)
                VALUES ($1, $2)
                ON CONFLICT (tier_name) DO NOTHING
                RETURNING id
            `, [p.name, JSON.stringify(p.features)]);

            if (res.rows.length === 0) {
                res = await client.query(`SELECT id FROM plans WHERE tier_name = $1`, [p.name]);
            }
            planMap.set(p.name, res.rows[0].id);
        }

        // Tenants
        const tenants = [
            { id: 1, name: 'Basic Shop', tier: 'BASIC' },
            { id: 999, name: 'Pro Shop', tier: 'PRO' }
        ];

        for (const t of tenants) {
            await client.query(`
                INSERT INTO tenants (id, name, status)
                VALUES ($1, $2, 'ACTIVE')
                ON CONFLICT (id) DO NOTHING
            `, [t.id, t.name]);

            const planId = planMap.get(t.tier);
            await client.query(`
                INSERT INTO subscriptions (
                    tenant_id, plan_id, status, 
                    current_period_start, current_period_end
                )
                VALUES ($1, $2, 'ACTIVE', NOW(), NOW() + INTERVAL '1 year')
                ON CONFLICT (tenant_id) WHERE status IN ('ACTIVE', 'TRIALING', 'PAST_DUE')
                DO UPDATE SET plan_id = EXCLUDED.plan_id
            `, [t.id, planId]);
        }
        console.log(`✅ Tenants & Subscriptions synced.`);

        await client.query('COMMIT');
        console.log('✨ Seed Complete.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Seed Failed:', e);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
