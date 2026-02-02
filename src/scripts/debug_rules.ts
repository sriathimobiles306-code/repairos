
import { Pool } from 'pg';

const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
};

async function debug() {
    const pool = new Pool(DB_CONFIG);
    const client = await pool.connect();
    try {
        console.log('--- DEBUGGING RULES FOR Samsung A54 ---');

        // 1. Find A54 Screen ID
        const a54Res = await client.query(`
            SELECT s.id, m.name as model_name 
            FROM mobile_models m 
            JOIN model_screen_map map ON m.id = map.model_id 
            JOIN screens s ON map.screen_id = s.id 
            WHERE m.name ILIKE '%A54%'
        `);

        if (a54Res.rows.length === 0) {
            console.log('❌ A54 Model not found!');
            return;
        }
        const targetScreenId = a54Res.rows[0].id;
        console.log(`✅ Target Screen ID (A54): ${targetScreenId}`);

        // 2. Check Universal Rules targeting this screen
        const rulesRes = await client.query(`
            SELECT 
                r.id, 
                src.id as source_screen_id,
                src_model.name as source_model_guess,
                r.fit_score, 
                r.warnings 
            FROM universal_glass_rules r
            JOIN screens src ON r.source_screen_id = src.id
            LEFT JOIN model_screen_map map ON map.screen_id = src.id
            LEFT JOIN mobile_models src_model ON map.model_id = src_model.id
            WHERE r.target_screen_id = $1
        `, [targetScreenId]);

        console.log(`\nFound ${rulesRes.rows.length} Universal Rules targeting A54:`);
        rulesRes.rows.forEach(r => {
            console.log(`   - Rule ID: ${r.id}, Source: ${r.source_model_guess || 'Unknown/Generic'} (Screen ${r.source_screen_id}), Score: ${r.fit_score}`);
        });

        // 3. Check Precomputed Matches
        const precomputeRes = await client.query(`
            SELECT matches_json FROM precomputed_matches WHERE screen_id = $1
        `, [targetScreenId]);

        if (precomputeRes.rows.length === 0) {
            console.log('\n❌ No Precomputed Matches found for A54!');
        } else {
            const matches = precomputeRes.rows[0].matches_json;
            console.log(`\n✅ Precomputed Matches JSON contains ${matches.length} items:`);
            matches.forEach((m: any) => {
                console.log(`   - SKU: ${m.sku_code}, Status: ${m.status}, Name: ${m.glass_marketing_name}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

debug();
