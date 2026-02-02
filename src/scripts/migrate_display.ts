
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('📦 Running Migration: Add Display Properties...');

        await client.query(`
            ALTER TABLE screens 
            ADD COLUMN IF NOT EXISTS display_resolution VARCHAR(20),
            ADD COLUMN IF NOT EXISTS connection_type VARCHAR(50),
            ADD COLUMN IF NOT EXISTS panel_technology VARCHAR(20),
            ADD COLUMN IF NOT EXISTS refresh_rate_hz INT DEFAULT 60;
        `);
        console.log('✅ Display columns added to screens table.');

    } catch (e) {
        console.error('❌ Migration Failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
