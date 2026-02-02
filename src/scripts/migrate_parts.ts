
import { Pool } from 'pg';

// Defaults to the CURRENTLY configured DB (Neon by default unless env changed)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('📦 Creating Part Finder Tables...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS electronic_parts (
                id SERIAL PRIMARY KEY,
                part_code VARCHAR(100) NOT NULL UNIQUE,
                category VARCHAR(50) DEFAULT 'IC',
                description TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS part_compatibility (
                id SERIAL PRIMARY KEY,
                part_id INT NOT NULL REFERENCES electronic_parts(id) ON DELETE CASCADE,
                brand VARCHAR(100) NOT NULL,
                model VARCHAR(100) NOT NULL,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                CONSTRAINT unique_part_model_pair UNIQUE (part_id, brand, model)
            );
        `);

        // Seed PM8953 Data
        console.log('🌱 Seeding PM8953 Data...');

        // 1. Insert Part
        const partRes = await client.query(`
            INSERT INTO electronic_parts (part_code, description)
            VALUES ('PM8953', 'Qualcomm Power Management IC (PMIC)')
            ON CONFLICT (part_code) DO UPDATE SET description = EXCLUDED.description
            RETURNING id;
        `);
        const partId = partRes.rows[0].id;

        // 2. Insert Models
        const models = [
            { brand: 'Xiaomi', model: 'Redmi Note 4' },
            { brand: 'Xiaomi', model: 'Redmi Note 4X' },
            { brand: 'Xiaomi', model: 'Mi A1' },
            { brand: 'Xiaomi', model: 'Mi 5X' },
            { brand: 'Samsung', model: 'Galaxy J7 V' },
            { brand: 'Samsung', model: 'Galaxy C7' },
            { brand: 'Samsung', model: 'Galaxy J8' },
            { brand: 'Oppo', model: 'A5' },
            { brand: 'Oppo', model: 'A7' }
        ];

        for (const m of models) {
            await client.query(`
                INSERT INTO part_compatibility (part_id, brand, model)
                VALUES ($1, $2, $3)
                ON CONFLICT (part_id, brand, model) DO NOTHING
            `, [partId, m.brand, m.model]);
        }

        console.log(`✅ Part Finder Ready. Seeded ${models.length} models for PM8953.`);

    } catch (e) {
        console.error('❌ Migration Failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
