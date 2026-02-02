
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function fix() {
    const client = await pool.connect();
    try {
        console.log('🔧 Fixing Subscription Columns...');

        await client.query(`
            ALTER TABLE subscriptions 
            ADD COLUMN IF NOT EXISTS usage_count INT DEFAULT 0;

            ALTER TABLE subscriptions 
            ADD COLUMN IF NOT EXISTS usage_limit INT DEFAULT 50;
        `);

        console.log('✅ Columns Added.');

    } catch (e) {
        console.error('❌ Fix Failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

fix();
