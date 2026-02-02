
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const DB_CONFIG = {
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
};

const pool = new Pool(DB_CONFIG);

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting Migration...');

        // CLEAN SLATE (Strict Verification Mode)
        console.log('💥 Resetting Schema...');
        await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');

        const files = [
            'global_schema.sql',
            'tenant_schema.sql',
            'precompute_schema.sql'
        ];

        for (const file of files) {
            const filePath = path.join(__dirname, '../../sql', file);
            console.log(`📄 Reading ${file}...`);
            const sql = fs.readFileSync(filePath, 'utf8');

            console.log(`🚀 Executing ${file}...`);
            await client.query(sql);
            console.log(`✅ ${file} applied.`);
        }

        console.log('✨ Migration Complete.');
    } catch (e) {
        console.error('❌ Migration Failed:', e);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
