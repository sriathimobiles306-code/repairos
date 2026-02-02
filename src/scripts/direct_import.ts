
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
        process.exit(1);
    }

    console.log('🚀 Reading CSV...');
    const content = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    console.log(`📊 Found ${lines.length} lines. Processing...`);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Parsing & Deduplication
        const brandMap = new Map<string, string>(); // slug -> name
        const rows: { slug: string, model: string, aliases: string }[] = [];

        for (const line of lines) {
            // Regex to handle "Brand", "Model", "Alias"
            const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!cols || cols.length < 2) continue;

            const brandName = clean(cols[0]);
            const modelName = clean(cols[1]);
            const alias = cols[2] ? clean(cols[2]) : '';

            if (!brandName || !modelName) continue;

            const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            brandMap.set(slug, brandName);
            rows.push({ slug, model: modelName, aliases: alias });
        }

        console.log(`🔍 Identified ${brandMap.size} unique brands.`);

        // 2. Sync Brands (Bulk)
        const slugs = Array.from(brandMap.keys());
        const brandIdMap = new Map<string, number>();

        // Get existing
        if (slugs.length > 0) {
            const existingRes = await client.query('SELECT id, slug FROM brands');
            existingRes.rows.forEach(r => brandIdMap.set(r.slug, r.id));
        }

        // Insert missing
        const missingSlugs = slugs.filter(s => !brandIdMap.has(s));
        if (missingSlugs.length > 0) {
            console.log(`✨ Bulk Creating ${missingSlugs.length} new brands (Single Query)...`);

            const brandValues: any[] = [];
            const brandPlaceholders: string[] = [];
            let bpIdx = 1;

            missingSlugs.forEach(s => {
                brandPlaceholders.push(`($${bpIdx}, $${bpIdx + 1})`);
                brandValues.push(brandMap.get(s), s); // name, slug
                bpIdx += 2;
            });

            const bulkBrandQuery = `
                INSERT INTO brands (name, slug) 
                VALUES ${brandPlaceholders.join(', ')}
                ON CONFLICT (slug) DO NOTHING
            `;

            await client.query(bulkBrandQuery, brandValues);
            console.log('✅ Brands created. Refreshing cache...');

            // Refresh Map
            const refreshRes = await client.query('SELECT id, slug FROM brands');
            refreshRes.rows.forEach(r => brandIdMap.set(r.slug, r.id));
        }

        // 3. Batch Insert Models
        console.log(`📦 Bulk Inserting Models in batches of 1000...`);
        let inserted = 0;

        // Group models by 1000
        const BATCH_SIZE = 1000;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const values: any[] = [];
            const placeholders: string[] = [];

            let pIdx = 1;
            batch.forEach(row => {
                const bId = brandIdMap.get(row.slug);
                if (bId) {
                    placeholders.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2})`);
                    values.push(bId, row.model, row.aliases ? [row.aliases] : []); // Aliases as text[]
                    pIdx += 3;
                }
            });

            if (placeholders.length > 0) {
                const query = `
                    INSERT INTO mobile_models (brand_id, name, aliases) 
                    VALUES ${placeholders.join(', ')}
                    ON CONFLICT DO NOTHING
                `;
                await client.query(query, values);
                inserted += placeholders.length;
                process.stdout.write('.');
            }
        }

        await client.query('COMMIT');
        console.log(`\n✅ SUCCESS! Processed ${inserted} models.`);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('\n❌ FATAL ERROR:', e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
