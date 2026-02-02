
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('📦 Creating Tenants & Subscription Tables...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS tenants (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                status VARCHAR(20) DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS tenant_users (
                id SERIAL PRIMARY KEY,
                tenant_id INT REFERENCES tenants(id),
                email VARCHAR(150) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(150),
                role VARCHAR(20) CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
            );

            CREATE TABLE IF NOT EXISTS plans (
                id SERIAL PRIMARY KEY,
                tier_name VARCHAR(50) NOT NULL UNIQUE, 
                features_json JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                tenant_id INT NOT NULL REFERENCES tenants(id),
                plan_id INT NOT NULL REFERENCES plans(id),
                status VARCHAR(20) DEFAULT 'ACTIVE',
                
                usage_count INT DEFAULT 0,
                usage_limit INT DEFAULT 50, 
                
                current_period_start TIMESTAMP DEFAULT NOW(),
                current_period_end TIMESTAMP,
                
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Seed Plans
        console.log('🌱 Seeding Plans...');
        await client.query(`
            INSERT INTO plans (tier_name, features_json) VALUES 
            ('BASIC', '{"search_limit": 50, "pro_features": false}'),
            ('PRO', '{"search_limit": -1, "pro_features": true}')
            ON CONFLICT (tier_name) DO NOTHING;
        `);

        console.log('✅ Subscription tables ready.');

    } catch (e) {
        console.error('❌ Migration Failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
