
import { Injectable, Inject, BadRequestException, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);
    private pool: Pool;

    // We can inject the pool if it was a provider, but for consistency with CompatibilityService
    // we'll stick to the pattern or inject it if we change SharedModule.
    // However, since we added TypeORM, we can also use DataSource.
    // Let's use raw Pool for specific queries to match the "Raw SQL" preference 
    // or just use TypeORM's query runner. 
    // Actually, CompatibilityService creates its OWN pool. That's not ideal for connection limits.
    // But let's follow that pattern for now to minimize disruption, or better, 
    // use the DataSource injected by TypeORM which we set up in AppModule.

    constructor() {
        // Fallback for now, ideally inject DataSource
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
        });
    }

    async createPhone(brandName: string, modelName: string, aliases: string[] = []) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Get or Create Brand
            let brandId: number;
            const brandRes = await client.query('SELECT id FROM brands WHERE name ILIKE $1', [brandName]);

            if (brandRes.rows.length > 0) {
                brandId = brandRes.rows[0].id;
            } else {
                const slug = brandName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const newBrand = await client.query(
                    'INSERT INTO brands (name, slug) VALUES ($1, $2) RETURNING id',
                    [brandName, slug]
                );
                brandId = newBrand.rows[0].id;
            }

            // 2. Create Model
            // Check for duplicate
            const dupCheck = await client.query(
                'SELECT id FROM mobile_models WHERE brand_id = $1 AND name ILIKE $2',
                [brandId, modelName]
            );

            if (dupCheck.rows.length > 0) {
                throw new ConflictException(`Model '${modelName}' already exists for ${brandName}.`);
            }

            await client.query(
                'INSERT INTO mobile_models (brand_id, name, aliases) VALUES ($1, $2, $3)',
                [brandId, modelName, aliases]
            );

            await client.query('COMMIT');
            this.logger.log(`Created phone: ${brandName} ${modelName}`);
            return { success: true, message: `Added ${brandName} ${modelName}` };

        } catch (e) {
            await client.query('ROLLBACK');
            this.logger.error(e);
            throw e;
        } finally {
            client.release();
        }
    }

    async createScreen(dto: any) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const query = `
                INSERT INTO screens 
                (type, diagonal_inch, width_mm, height_mm, corner_radius_mm, cutout_type, cutout_width, cutout_height, cutout_x, cutout_y)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            `;

            const values = [
                dto.type,
                dto.diagonal,
                dto.width,
                dto.height,
                dto.cornerRadius || 0,
                dto.cutoutType,
                dto.cutoutWidth || 0,
                dto.cutoutHeight || 0,
                dto.cutoutX || 0,
                dto.cutoutY || 0
            ];

            const res = await client.query(query, values);

            await client.query('COMMIT');
            this.logger.log(`Created screen ID: ${res.rows[0].id}`);
            return { success: true, id: res.rows[0].id, message: 'Screen profile created' };

        } catch (e) {
            await client.query('ROLLBACK');
            this.logger.error(e);
            throw e;
        } finally {
            client.release();
        }
    }

    async getStats() {
        const client = await this.pool.connect();
        try {
            // Run counts in parallel
            const [phones, screens, rules] = await Promise.all([
                client.query('SELECT COUNT(*) FROM mobile_models'),
                client.query('SELECT COUNT(*) FROM screens'),
                // Pending rules are those needing approval (safe=false OR approved=null)
                // Actually our schema constraint says: (is_safe=FALSE) OR (is_safe=TRUE AND approved_at IS NOT NULL)
                // So "Pending" means maybe we have a staging state? 
                // Let's assume we want to review ALL rules that are NOT explicitly approved yet?
                // For now, let's just count ALL universal rules that are NOT approved.
                client.query('SELECT COUNT(*) FROM universal_glass_rules WHERE approved_at IS NULL')
            ]);

            return {
                totalPhones: parseInt(phones.rows[0].count, 10),
                activeScreens: parseInt(screens.rows[0].count, 10),
                pendingRules: parseInt(rules.rows[0].count, 10)
            };
        } finally {
            client.release();
        }
    }

    async getPendingRules() {
        const client = await this.pool.connect();
        try {
            // Retrieve detailed info joining screens
            const query = `
                SELECT 
                    r.id, 
                    r.fit_score, 
                    r.warnings, 
                    s1.diagonal_inch as source_diag,
                    s2.diagonal_inch as target_diag
                FROM universal_glass_rules r
                JOIN screens s1 ON r.source_screen_id = s1.id
                JOIN screens s2 ON r.target_screen_id = s2.id
                WHERE r.approved_at IS NULL
                ORDER BY r.fit_score DESC
                LIMIT 50
             `;
            const res = await client.query(query);
            return res.rows;
        } finally {
            client.release();
        }
    }

    async approveRule(id: number, userId: number) {
        const client = await this.pool.connect();
        try {
            await client.query(
                'UPDATE universal_glass_rules SET approved_at = NOW(), approved_by = $1, is_safe_to_recommend = TRUE WHERE id = $2',
                [userId, id]
            );
            return { success: true };
        } finally {
            client.release();
        }
    }

    // --- MAPPER LOGIC ---

    async getUnmappedPhones() {
        const client = await this.pool.connect();
        try {
            // Find models that do NOT have an active entry in model_screen_map
            const query = `
                SELECT m.id, m.name, b.name as brand_name
                FROM mobile_models m
                JOIN brands b ON m.brand_id = b.id
                WHERE m.id NOT IN (
                    SELECT model_id FROM model_screen_map WHERE is_active = TRUE
                )
                ORDER BY b.name, m.name
            `;
            const res = await client.query(query);
            return res.rows;
        } finally {
            client.release();
        }
    }

    async getAllScreens() {
        const client = await this.pool.connect();
        try {
            // Return concise summary for dropdown
            const res = await client.query(`
                SELECT id, diagonal_inch, type, cutout_type 
                FROM screens 
                ORDER BY diagonal_inch DESC
            `);
            return res.rows;
        } finally {
            client.release();
        }
    }

    async mapPhoneToScreen(modelId: number, screenId: number, userId: number) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Deactivate any existing active map (just in case, though query above filters them)
            await client.query(
                'UPDATE model_screen_map SET is_active = FALSE WHERE model_id = $1',
                [modelId]
            );

            // Insert new map
            await client.query(
                `INSERT INTO model_screen_map 
                (model_id, screen_id, is_active, verification_source, verified_by_user_id)
                VALUES ($1, $2, TRUE, 'MANUAL_ADMIN', $3)`,
                [modelId, screenId, userId]
            );

            await client.query('COMMIT');
            return { success: true };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async importPhones(data: { brand: string; model: string; aliases?: string; diagonal?: number; width?: number; height?: number }[]) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            let addedCount = 0;
            let skippedCount = 0;
            const brandCache = new Map<string, number>();

            for (const item of data) {
                // 1. Get/Create Brand (Robust "Get or Create" by Slug with Caching)
                let brandId: number;
                const cleanName = item.brand.trim();
                const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

                if (brandCache.has(slug)) {
                    brandId = brandCache.get(slug)!;
                } else {
                    // First check by Slug (most reliable canonical check)
                    const brandRes = await client.query('SELECT id FROM brands WHERE slug = $1', [slug]);

                    if (brandRes.rows.length > 0) {
                        brandId = brandRes.rows[0].id;
                    } else {
                        // Double check by Name
                        const nameRes = await client.query('SELECT id FROM brands WHERE name ILIKE $1', [cleanName]);
                        if (nameRes.rows.length > 0) {
                            brandId = nameRes.rows[0].id;
                        } else {
                            // Create New
                            try {
                                const newBrand = await client.query(
                                    'INSERT INTO brands (name, slug) VALUES ($1, $2) RETURNING id',
                                    [cleanName, slug]
                                );
                                brandId = newBrand.rows[0].id;
                            } catch (err: any) {
                                if (err.code === '23505') { // unique_violation
                                    const retry = await client.query('SELECT id FROM brands WHERE slug = $1', [slug]);
                                    brandId = retry.rows[0].id;
                                } else {
                                    throw err;
                                }
                            }
                        }
                    }
                    brandCache.set(slug, brandId);
                }

                // 2. Insert Model if not exists
                let modelId: number;
                const dupCheck = await client.query(
                    'SELECT id FROM mobile_models WHERE brand_id = $1 AND name ILIKE $2',
                    [brandId, item.model.trim()]
                );

                if (dupCheck.rows.length > 0) {
                    modelId = dupCheck.rows[0].id;
                    skippedCount++;
                } else {
                    const newModel = await client.query(
                        'INSERT INTO mobile_models (brand_id, name, aliases) VALUES ($1, $2, $3) RETURNING id',
                        [brandId, item.model, item.aliases ? [item.aliases] : []]
                    );
                    modelId = newModel.rows[0].id;
                    addedCount++;
                }

                // 3. Handle Screen Dimensions (if provided)
                if (item.width && item.height && item.diagonal) {
                    // Check if a screen profile matches exactly (within 0.1mm)
                    const screenRes = await client.query(`
                        SELECT id FROM screens 
                        WHERE ABS(width_mm - $1) < 0.1 
                        AND ABS(height_mm - $2) < 0.1
                        AND type = 'FLAT' -- Assume import is flat
                    `, [item.width, item.height]);

                    let screenId: number;
                    if (screenRes.rows.length > 0) {
                        screenId = screenRes.rows[0].id;
                    } else {
                        // Create new Screen Profile
                        const newScreen = await client.query(`
                            INSERT INTO screens (type, diagonal_inch, width_mm, height_mm, corner_radius_mm, cutout_type)
                            VALUES ('FLAT', $1, $2, $3, 2.5, 'NONE') RETURNING id
                        `, [item.diagonal, item.width, item.height]);
                        screenId = newScreen.rows[0].id;
                    }

                    // Map it
                    await client.query(`
                        INSERT INTO model_screen_map (model_id, screen_id, is_active, verification_source)
                        VALUES ($1, $2, TRUE, 'BULK_IMPORT')
                        ON CONFLICT (model_id) DO UPDATE SET screen_id = $2, is_active = TRUE
                    `, [modelId, screenId]);
                }
            }

            await client.query('COMMIT');
            return { success: true, added: addedCount, skipped: skippedCount };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async deletePhone(id: number) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            // Clean up map first (if not cascading)
            await client.query('DELETE FROM model_screen_map WHERE model_id = $1', [id]);
            await client.query('DELETE FROM mobile_models WHERE id = $1', [id]);
            await client.query('COMMIT');
            return { success: true };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async deleteScreen(id: number) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM model_screen_map WHERE screen_id = $1', [id]);
            await client.query('DELETE FROM universal_glass_rules WHERE source_screen_id = $1 OR target_screen_id = $1', [id]);
            await client.query('DELETE FROM screens WHERE id = $1', [id]);
            await client.query('COMMIT');
            return { success: true };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async updateStock(skuCode: string, quantity: number) {
        const res = await this.pool.query(
            'UPDATE tempered_glass_skus SET stock_quantity = $1 WHERE sku_code = $2 RETURNING sku_code, stock_quantity',
            [quantity, skuCode]
        );
        if (res.rows.length === 0) {
            throw new NotFoundException(`SKU ${skuCode} not found`);
        }
        if (res.rows.length === 0) {
            throw new NotFoundException(`SKU ${skuCode} not found`);
        }
        return res.rows[0];
    }

    async listInventory() {
        const res = await this.pool.query(`
            SELECT sku_code, marketing_name, stock_quantity, glass_width_mm, glass_height_mm 
            FROM tempered_glass_skus 
            ORDER BY stock_quantity ASC
        `);
        return res.rows;
    }
}
