
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('📦 Running Migration: Add Stock Quantity...');

        // Check if column exists
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='tempered_glass_skus' AND column_name='stock_quantity';
        `);

        if (res.rows.length === 0) {
            await client.query(`
                ALTER TABLE tempered_glass_skus 
                ADD COLUMN stock_quantity INT NOT NULL DEFAULT 10; -- Default 10 for demo
            `);
            console.log('✅ Column added. Default stock set to 10.');
        } else {
            console.log('ℹ️ Column already exists.');
        }

    } catch (e) {
        console.error('❌ Migration Failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
