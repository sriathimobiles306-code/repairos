
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('📦 Creating Administrators Table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS administrators (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'SUPER_ADMIN',
                tenant_id INT, 
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Seed Default Admin
        const pass = await bcrypt.hash('admin123', 10);
        await client.query(`
            INSERT INTO administrators (username, password_hash, role)
            VALUES ('admin', $1, 'SUPER_ADMIN')
            ON CONFLICT (username) DO NOTHING
        `, [pass]);

        console.log('✅ Administrators table ready. Default user: admin / admin123');

    } catch (e) {
        console.error('❌ Migration Failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
