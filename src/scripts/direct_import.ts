
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const csvFilePath = path.join(process.cwd(), 'gsm.csv');

// Regex to clean quotes: "Samsung" -> Samsung
const clean = (str: string) => str ? str.trim().replace(/^"|"$/g, '').trim() : '';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false } // Force SSL for NeonDB
});

async function run() {
    if (!fs.existsSync(csvFilePath)) {
        console.error(`❌ gsm.csv not found at ${csvFilePath}`);
        console.error('Please put the file in the project root folder.');
        process.exit(1);
    }

    console.log('🚀 Starting Direct Import from gsm.csv...');
    const content = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = content.split('\n');

    const client = await pool.connect();

    // Cache: slug -> brandId
    const brandCache = new Map<string, number>();

    let added = 0;
    let skipped = 0;

    try {
        await client.query('BEGIN');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Basic CSV split (handling simple commas)
            // Note: If fields have commas inside quotes, this simple split breaks. 
            // But looking at screenshot, it seems standard. 
            // Better regex split: 
            const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');

            if (cols.length < 2) continue;

            const brandRaw = clean(cols[0]);
            const modelRaw = clean(cols[1]);
            const aliasRaw = cols[2] ? clean(cols[2]) : '';

            // Just basic Dimensions mapping if they exist (cols 3,4,5)
            // Not focus here, user wants GSM list mainly.

            if (!brandRaw || !modelRaw) continue;

            // --- 1. HANDLE BRAND ---
            let brandId: number;
            const slug = brandRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

            if (brandCache.has(slug)) {
                brandId = brandCache.get(slug)!;
            } else {
                // Check DB
                const res = await client.query('SELECT id FROM brands WHERE slug = $1', [slug]);

                if (res.rows.length > 0) {
                    brandId = res.rows[0].id;
                } else {
                    // Try by Name
                    const resName = await client.query('SELECT id FROM brands WHERE name ILIKE $1', [brandRaw]);
                    if (resName.rows.length > 0) {
                        brandId = resName.rows[0].id;
                    } else {
                        // Create
                        try {
                            const ins = await client.query(
                                'INSERT INTO brands (name, slug) VALUES ($1, $2) RETURNING id',
                                [brandRaw, slug]
                            );
                            brandId = ins.rows[0].id;
                        } catch (e: any) {
                            if (e.code === '23505') {
                                const retry = await client.query('SELECT id FROM brands WHERE slug = $1', [slug]);
                                brandId = retry.rows[0].id;
                            } else {
                                throw e;
                            }
                        }
                    }
                }
                brandCache.set(slug, brandId);
            }

            // --- 2. HANDLE MODEL ---
            const modelRes = await client.query(
                'SELECT id FROM mobile_models WHERE brand_id = $1 AND name ILIKE $2',
                [brandId, modelRaw]
            );

            if (modelRes.rows.length === 0) {
                await client.query(
                    'INSERT INTO mobile_models (brand_id, name, aliases) VALUES ($1, $2, $3)',
                    [brandId, modelRaw, aliasRaw ? [aliasRaw] : []]
                );
                added++;
            } else {
                skipped++;
            }

            if ((i + 1) % 100 === 0) {
                console.log(`Processed ${i + 1} lines...`);
            }
        }

        await client.query('COMMIT');
        console.log(`\n✅ DONE! Added: ${added}, Skipped: ${skipped}`);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error:', e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
