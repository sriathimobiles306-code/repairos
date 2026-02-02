// src/jobs/precomputeMatches.ts

import { Pool, PoolClient } from 'pg';
import * as crypto from 'crypto';
import {
    StrictGeometryMatcher,
    ScreenGeometry,
    GlassGeometry,
    UniversalRule,
    Curvature,
    EdgeCoverage,
    MatchResult,
    MatchStatus
} from '../core';

// --- CONFIGURATION ---
const BATCH_SIZE = 50;
const DB_CONFIG = {
    // In production, use env vars.
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
};

// --- TYPES ---
// Strict type extending MatchResult to enforce carrying Identity
type PrecomputeMatchResult = MatchResult & {
    glass_db_id: number; // Changed to number per strict requirement
    sku_code: string;
    glass_marketing_name?: string;
};

// --- MAPPERS ---

function mapRowToScreen(row: any): ScreenGeometry {
    return {
        id: row.id,
        dimensions: { width_mm: parseFloat(row.width_mm), height_mm: parseFloat(row.height_mm) },
        active_area: { width_mm: parseFloat(row.active_area_width_mm), height_mm: parseFloat(row.active_area_height_mm) },
        curvature: row.curved_type as Curvature,
        corner_radius_mm: parseFloat(row.corner_radius_mm || '0'),
        cutout_mask_svg: row.cutout_mask_svg,
        fit_tolerances: typeof row.fit_tolerances === 'string' ? JSON.parse(row.fit_tolerances) : row.fit_tolerances
    };
}

function mapRowToGlass(row: any): GlassGeometry {
    return {
        sku_code: row.sku_code,
        dimensions: { width_mm: parseFloat(row.glass_width_mm), height_mm: parseFloat(row.glass_height_mm) },
        curvature: row.glass_curvature as Curvature,
        corner_radius_mm: parseFloat(row.glass_corner_radius_mm || '0'),
        cutout_mask_svg: row.cutout_mask_svg || 'none',
        edge_coverage: row.edge_coverage as EdgeCoverage,
        cutout_alignment_offset_allowance_mm: parseFloat(row.cutout_alignment_offset_mm || '0.5')
    };
}

function mapRowToRule(row: any): UniversalRule {
    return {
        target_screen_id: row.target_screen_id,
        source_screen_id: row.source_screen_id,
        fit_score: parseFloat(row.fit_score),
        is_safe: row.is_safe_to_recommend,
        warnings: row.warnings || []
    };
}

// --- BATCH DATA ACCESS ---

async function fetchScreens(client: PoolClient, limit: number, offset: number): Promise<any[]> {
    const res = await client.query(`
        SELECT * FROM screens 
        ORDER BY id ASC 
        LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return res.rows;
}

// Fetch Exact Candidates for WHOLE BATCH of screens
async function fetchExactCandidatesForBatch(client: PoolClient, screenIds: string[]): Promise<Map<string, any[]>> {
    if (screenIds.length === 0) return new Map();

    const res = await client.query(`
        SELECT * FROM tempered_glass_skus 
        WHERE screen_id = ANY($1)
    `, [screenIds]);

    // Group by screen_id
    const map = new Map<string, any[]>();
    for (const row of res.rows) {
        if (!map.has(row.screen_id)) map.set(row.screen_id, []);
        map.get(row.screen_id)!.push(row);
    }
    return map;
}

// Fetch Universal Candidates for WHOLE BATCH
async function fetchUniversalCandidatesForBatch(client: PoolClient, targetScreenIds: string[]): Promise<Map<string, { glass: any, rule: any }[]>> {
    if (targetScreenIds.length === 0) return new Map();

    const res = await client.query(`
        SELECT 
            s.*,
            r.fit_score, r.is_safe_to_recommend, r.warnings, r.target_screen_id, r.source_screen_id,
            s.id as glass_id_alias, s.sku_code as glass_sku_alias, 
            s.glass_width_mm, s.glass_height_mm, s.glass_curvature, s.glass_corner_radius_mm,
            s.cutout_mask_svg as glass_mask, s.edge_coverage, s.cutout_alignment_offset_mm,
            s.marketing_name
        FROM universal_glass_rules r
        JOIN tempered_glass_skus s ON s.screen_id = r.source_screen_id
        WHERE r.target_screen_id = ANY($1)
          AND r.is_safe_to_recommend = TRUE 
          AND r.approved_at IS NOT NULL
    `, [targetScreenIds]);

    const map = new Map<string, { glass: any, rule: any }[]>();
    for (const row of res.rows) {
        const glassObj = {
            id: row.glass_id_alias,
            sku_code: row.glass_sku_alias,
            glass_width_mm: row.glass_width_mm,
            glass_height_mm: row.glass_height_mm,
            glass_curvature: row.glass_curvature,
            glass_corner_radius_mm: row.glass_corner_radius_mm,
            cutout_mask_svg: row.glass_mask,
            edge_coverage: row.edge_coverage,
            cutout_alignment_offset_mm: row.cutout_alignment_offset_mm,
            marketing_name: row.marketing_name
        };
        const ruleObj = {
            target_screen_id: row.target_screen_id,
            source_screen_id: row.source_screen_id,
            fit_score: row.fit_score,
            is_safe_to_recommend: row.is_safe_to_recommend,
            warnings: row.warnings
        };

        const targetId = row.target_screen_id; // From Rule
        if (!map.has(targetId)) map.set(targetId, []);
        map.get(targetId)!.push({ glass: glassObj, rule: ruleObj });
    }
    return map;
}

async function upsertPrecomputedMatch(client: PoolClient, screenId: string, results: PrecomputeMatchResult[]) {
    // 1. Sort by Confidence DESC (Clone first)
    const sorted = [...results].sort((a, b) => b.confidence - a.confidence);

    // 2. Extract Ordered IDs (Safe, Typed as number)
    const orderedSkuIds = sorted.map(m => m.glass_db_id);

    const hasExact = sorted.some(r => r.status === MatchStatus.EXACT);
    const bestUniv = sorted
        .filter(r => r.status === MatchStatus.UNIVERSAL)
        .reduce((max, r) => Math.max(max, r.confidence), 0.0);

    // 3. Serialize (or empty list)
    const matchesJson = JSON.stringify(sorted);

    // 4. Upsert (Handles clearing stale data if sorted is empty)
    await client.query(`
        INSERT INTO precomputed_matches (
            screen_id, matches_json, ordered_sku_ids, has_exact_match, best_universal_confidence, computed_at, updated_at
        ) VALUES (
            $1, $2::jsonb, $3, $4, $5, NOW(), NOW()
        )
        ON CONFLICT (screen_id) DO UPDATE SET
            matches_json = EXCLUDED.matches_json,
            ordered_sku_ids = EXCLUDED.ordered_sku_ids,
            has_exact_match = EXCLUDED.has_exact_match,
            best_universal_confidence = EXCLUDED.best_universal_confidence,
            computed_at = NOW(),
            updated_at = NOW()
    `, [
        screenId,
        matchesJson,
        orderedSkuIds,
        hasExact,
        bestUniv
    ]);
}

// --- MAIN JOB ---

export async function runPrecomputeJob() {
    const jobId = crypto.randomBytes(8).toString('hex');
    console.log(`[Job:${jobId}] Starting Precompute Matches...`);

    const pool = new Pool(DB_CONFIG);
    const client = await pool.connect();

    try {
        let processedCount = 0;
        let offset = 0;

        while (true) {
            const screensRows = await fetchScreens(client, BATCH_SIZE, offset);
            if (screensRows.length === 0) break;

            console.log(`[Job:${jobId}] Processing batch ${offset} - ${offset + screensRows.length}`);

            // BATCH FETCHING
            const screenIds = screensRows.map(s => s.id);
            const exactCandidatesMap = await fetchExactCandidatesForBatch(client, screenIds);
            const universalCandidatesMap = await fetchUniversalCandidatesForBatch(client, screenIds);

            for (const screenRow of screensRows) {
                try {
                    const screen = mapRowToScreen(screenRow);
                    const processedGlassIds = new Set<string>();
                    const results: PrecomputeMatchResult[] = [];

                    // A. EXACT CANDIDATES
                    const exactRows = exactCandidatesMap.get(screenRow.id) || [];
                    for (const glassRow of exactRows) {
                        const glass = mapRowToGlass(glassRow);
                        const result = StrictGeometryMatcher.match(screen, glass);

                        if (result.status !== MatchStatus.INCOMPATIBLE) {
                            results.push({
                                ...result,
                                glass_db_id: parseInt(glassRow.id, 10), // Ensure number
                                sku_code: glassRow.sku_code,
                                glass_marketing_name: glassRow.marketing_name
                            });
                            processedGlassIds.add(glassRow.id);
                        }
                    }

                    // B. UNIVERSAL CANDIDATES
                    const univRows = universalCandidatesMap.get(screenRow.id) || [];
                    for (const { glass: glassRow, rule: ruleRow } of univRows) {
                        if (processedGlassIds.has(glassRow.id)) continue;

                        const glass = mapRowToGlass(glassRow);
                        const rule = mapRowToRule(ruleRow);
                        const result = StrictGeometryMatcher.match(screen, glass, rule);

                        if (result.status !== MatchStatus.INCOMPATIBLE) {
                            results.push({
                                ...result,
                                glass_db_id: parseInt(glassRow.id, 10), // Ensure number
                                sku_code: glassRow.sku_code,
                                glass_marketing_name: glassRow.marketing_name
                            });
                            processedGlassIds.add(glassRow.id);
                        }
                    }

                    // C. STORE (Always upsert, even if empty, to clear stale data)
                    await upsertPrecomputedMatch(client, screenRow.id, results);
                    processedCount++;

                } catch (err) {
                    console.error(`[Job:${jobId}] Error processing screen ${screenRow.id}:`, err);
                }
            }

            offset += BATCH_SIZE;
        }

        console.log(`[Job:${jobId}] Completed. Processed ${processedCount} screens.`);

    } catch (err) {
        console.error(`[Job:${jobId}] Fatal Job Error:`, err);
        throw err;
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    runPrecomputeJob().catch(e => {
        console.error(e);
        process.exit(1);
    });
}
