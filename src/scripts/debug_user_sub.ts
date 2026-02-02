
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
    const client = await pool.connect();
    try {
        console.log('--- PLANS ---');
        const plans = await client.query('SELECT * FROM plans');
        console.table(plans.rows);

        console.log('\n--- SUBSCRIPTIONS ---');
        const subs = await client.query(`
            SELECT s.id, s.tenant_id, p.tier_name, s.status, s.usage_count, s.usage_limit
            FROM subscriptions s
            JOIN plans p ON p.id = s.plan_id
        `);
        console.table(subs.rows);

    } finally {
        client.release();
        pool.end();
    }
}

main();
