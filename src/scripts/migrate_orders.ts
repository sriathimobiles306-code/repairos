
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('📦 Running Migration: Add Orders Tables...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                tenant_id INT NOT NULL, -- references tenants(id) but we skip constraint for script simplicity if needed, but better add it if table exists
                customer_name TEXT,
                customer_phone TEXT,
                total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
                status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INT NOT NULL REFERENCES orders(id),
                sku_code VARCHAR(50) NOT NULL,
                quantity INT NOT NULL,
                price_at_sale DECIMAL(10, 2) NOT NULL
            );
        `);
        console.log('✅ Orders tables created.');

    } catch (e) {
        console.error('❌ Migration Failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
