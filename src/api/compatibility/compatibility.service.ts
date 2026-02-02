// src/api/compatibility/compatibility.service.ts

import { Injectable, NotFoundException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import {
    CompatibilityCheckDto,
    CompatibilityResponse,
    SubscriptionTier,
    MatchResponseItem,
    SubscriptionGatingMeta
} from './compatibility.dto';

// DB Config (Should be injected via ConfigService in production)
const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
};

@Injectable()
export class CompatibilityService {
    private readonly logger = new Logger(CompatibilityService.name);
    private pool: Pool;

    constructor() {
        this.pool = new Pool(DB_CONFIG); // Use pool for all queries
    }

    async checkCompatibility(
        query: CompatibilityCheckDto,
        tenantTier: SubscriptionTier,
        tenantId: number
    ): Promise<CompatibilityResponse> {
        const client = await this.pool.connect(); // Client for Read Path (Search History uses pool direct)
        try {
            // 1. RESOLVE MODEL
            // Find Brand ID (Deterministic Limit 1)
            const brandRes = await client.query('SELECT id, name FROM brands WHERE name ILIKE $1 LIMIT 1', [query.brand]);
            if (brandRes.rows.length === 0) {
                throw new NotFoundException(`Brand '${query.brand}' not found.`);
            }
            const brand = brandRes.rows[0];

            // Find Model (Correct Alias Logic)
            // Check exact name OR if alias array contains the input
            const modelRes = await client.query(`
        SELECT id, name FROM mobile_models 
        WHERE brand_id = $1 
          AND (
            name ILIKE $2
            OR EXISTS (SELECT 1 FROM unnest(aliases) a WHERE a ILIKE $2)
          )
        LIMIT 1
      `, [brand.id, query.model]);

            if (modelRes.rows.length === 0) {
                throw new NotFoundException(`Model '${query.model}' not found for brand '${brand.name}'.`);
            }
            const model = modelRes.rows[0];

            // Find Active Map
            const mapRes = await client.query(`
        SELECT screen_id, confidence_score, verification_source 
        FROM model_screen_map 
        WHERE model_id = $1 AND is_active = TRUE
      `, [model.id]);

            if (mapRes.rows.length === 0) {
                throw new NotFoundException(`No active screen profile mapped for '${model.name}'.`);
            }
            const map = mapRes.rows[0];

            // 2. FETCH PRECOMPUTED MATCHES (Cache Source of Truth)
            const matchesRowRes = await client.query(`
        SELECT matches_json, has_exact_match 
        FROM precomputed_matches 
        WHERE screen_id = $1
      `, [map.screen_id]);

            if (matchesRowRes.rows.length === 0) {
                // CACHE MISS: WE DO NOT RECOMPUTE
                this.logger.warn(`Cache miss for screen_id ${map.screen_id}`);
                // Return Flat Error Payload
                throw new ServiceUnavailableException({
                    code: 'CACHE_MISS',
                    message: 'Compatibility data is being prepared. Try again shortly.'
                });
            }

            const matchesData = matchesRowRes.rows[0].matches_json;
            if (!Array.isArray(matchesData)) {
                this.logger.error(`Corrupt matches_json for screen_id ${map.screen_id}`);
                throw new ServiceUnavailableException({
                    code: 'DATA_ERROR',
                    message: 'Invalid compatibility data.'
                });
            }

            // Fetch Screen Profile for Response
            const screenRes = await client.query(`
        SELECT id, diagonal_inch, width_mm, height_mm, curved_type 
        FROM screens WHERE id = $1
      `, [map.screen_id]);
            const screen = screenRes.rows[0];

            // 3. HYDRATE WITH STOCK (Real-time)
            const skuCodes = matchesData.map(m => m.sku_code);
            let stockMap = new Map<string, number>();

            if (skuCodes.length > 0) {
                // Fetch stock for these SKUs
                const stockRes = await client.query(`
                    SELECT sku_code, stock_quantity 
                    FROM tempered_glass_skus 
                    WHERE sku_code = ANY($1)
                `, [skuCodes]);

                for (const row of stockRes.rows) {
                    stockMap.set(row.sku_code, row.stock_quantity);
                }
            }

            // 4. APPLY SUBSCRIPTION GATING & MAP RESPONSE
            const gatedResult = this.applySubscriptionGating(matchesData, stockMap, tenantTier);

            // 5. LOG SEARCH (Non-blocking / Fire-and-forget)
            // Do not await if we want true non-blocking, but catching prevents unhandled rejections.
            this.logSearchHistory(tenantId, model.id, map.screen_id, matchesData.length > 0);

            // 6. CONSTRUCT RESPONSE
            return {
                request: {
                    brand: brand.name,
                    model: query.model,
                    resolved_model: model.name
                },
                screen_profile: {
                    id: screen.id,
                    diagonal_inch: parseFloat(screen.diagonal_inch),
                    dimensions_mm: { w: parseFloat(screen.width_mm), h: parseFloat(screen.height_mm) },
                    type: screen.curved_type,
                    resolution: 'N/A'
                },
                matches: gatedResult.matches,
                warnings: this.collectWarnings(map, gatedResult.matches),
                subscription_gating: gatedResult.meta
            };

        } finally {
            client.release();
        }
    }

    // --- HELPER LOGIC (Pure) ---

    private applySubscriptionGating(
        allMatches: any[],
        stockMap: Map<string, number>,
        tier: SubscriptionTier
    ): { matches: MatchResponseItem[], meta: SubscriptionGatingMeta } {

        // Map raw JSON to Response Item
        // Explicit Separation: type (Logic) vs status (Color)
        const mappedMatches: MatchResponseItem[] = allMatches.map(m => ({
            type: m.status, // 'EXACT' | 'UNIVERSAL'
            sku_code: m.sku_code,
            name: m.glass_marketing_name || m.sku_code,
            status: m.status === 'EXACT' ? 'GREEN' : 'YELLOW',
            confidence: m.confidence,
            warnings: m.warnings || [],
            metadata: {
                edge: m.metadata?.edge_coverage || 'N/A',
                breakdown: m.confidence_breakdown
            },
            stock: stockMap.get(m.sku_code) || 0
        }));

        // PRO / ENTERPRISE: See everything
        if (tier === SubscriptionTier.PRO || tier === SubscriptionTier.ENTERPRISE) {
            return {
                matches: mappedMatches,
                meta: { allowed: true, hidden_universal_count: 0 }
            };
        }

        // BASIC: Limit Universal
        const exactMatches = mappedMatches.filter(m => m.type === 'EXACT');
        const universalMatches = mappedMatches.filter(m => m.type === 'UNIVERSAL');
        const UNIVERSAL_LIMIT = 5;

        const visibleUniversal = universalMatches.slice(0, UNIVERSAL_LIMIT);
        const hiddenCount = Math.max(0, universalMatches.length - UNIVERSAL_LIMIT);

        return {
            matches: [...exactMatches, ...visibleUniversal],
            meta: {
                allowed: true,
                hidden_universal_count: hiddenCount,
                upgrade_message: hiddenCount > 0 ? `Upgrade to PRO to see ${hiddenCount} more universal matches.` : undefined
            }
        };
    }

    private collectWarnings(mapRow: any, matches: MatchResponseItem[]): string[] {
        const warnings: string[] = [];
        if (mapRow.confidence_score < 0.9) {
            warnings.push(`Model mapping verification is pending (Confidence: ${mapRow.confidence_score})`);
        }
        if (matches.length === 0) {
            warnings.push('No compatible glass found for this screen geometry.');
        }
        return warnings;
    }

    private logSearchHistory(tenantId: number, modelId: number, screenId: number, hasMatch: boolean) {
        // Fire-and-forget using pool directly (No Client Lifecycle overhead)
        this.pool.query(`
        INSERT INTO search_history (tenant_id, search_query, matched_model_id, matched_screen_id, result_status)
        VALUES ($1, $2, $3, $4, $5)
    `, [
            tenantId,
            'API_LOOKUP',
            modelId,
            screenId,
            hasMatch ? 'MATCH_FOUND' : 'NO_MATCH'
        ]).catch(err => {
            this.logger.error(`Search logging failed: ${err.message}`);
        });
    }

    // --- PHASE 9: DISPLAY & TOUCH LOGIC ---

    async checkDisplayCompatibility(sourceBrand: string, sourceModel: string, targetBrand: string, targetModel: string) {
        const client = await this.pool.connect();
        try {
            // 1. Get Source Screen Profile (Donor) by Name
            const sourceRes = await client.query(`
                SELECT s.* 
                FROM mobile_models m
                JOIN brands b ON m.brand_id = b.id
                JOIN model_screen_map map ON m.id = map.model_id
                JOIN screens s ON map.screen_id = s.id
                WHERE b.name ILIKE $1 AND (m.name ILIKE $2 OR $2 = ANY(m.aliases))
                limit 1
             `, [sourceBrand, sourceModel]);

            if (sourceRes.rows.length === 0) throw new NotFoundException('Source/Donor device not found');
            const donorProfile = this.mapToDisplayProfile(sourceRes.rows[0]);

            // 2. Get Target Screen Profile by Name
            const targetRes = await client.query(`
                SELECT s.* 
                FROM mobile_models m
                JOIN brands b ON m.brand_id = b.id
                JOIN model_screen_map map ON m.id = map.model_id
                JOIN screens s ON map.screen_id = s.id
                WHERE b.name ILIKE $1 AND (m.name ILIKE $2 OR $2 = ANY(m.aliases))
                limit 1
             `, [targetBrand, targetModel]);

            if (targetRes.rows.length === 0) throw new NotFoundException('Target/Recipient device not found');
            const targetProfile = this.mapToDisplayProfile(targetRes.rows[0]);

            // 3. Match
            const { DisplayMatcher } = require('../../core/matcher/DisplayMatcher');
            const result = DisplayMatcher.match(targetProfile, donorProfile);

            return {
                source: { brand: sourceBrand, model: sourceModel, ...donorProfile },
                target: { brand: targetBrand, model: targetModel, ...targetProfile },
                result
            };

        } finally {
            client.release();
        }
    }

    private mapToDisplayProfile(row: any) {
        return {
            id: row.id,
            dimensions: { width_mm: parseFloat(row.width_mm), height_mm: parseFloat(row.height_mm) },
            active_area: { width_mm: parseFloat(row.active_area_width_mm), height_mm: parseFloat(row.active_area_height_mm) },
            curvature: row.curved_type,
            corner_radius_mm: parseFloat(row.corner_radius_mm || 0),
            cutout_mask_svg: '', // Not critical for display connector check
            fit_tolerances: { max_oversize_mm: 0, min_undersize_mm: 0, allowed_misalignment_mm: 0 }, // Dummy
            display_resolution: row.display_resolution,
            connection_type: row.connection_type,
            panel_technology: row.panel_technology,
            refresh_rate_hz: row.refresh_rate_hz || 60
        };
    }
}
