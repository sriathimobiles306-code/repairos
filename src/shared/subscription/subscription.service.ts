
import { Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { SubscriptionTier } from '../../api/compatibility/compatibility.dto';

// DB Config
const DB_CONFIG = {
    // Falls back to ENV or uses the direct string for dev
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require'
};

@Injectable()
export class SubscriptionService {
    private readonly logger = new Logger(SubscriptionService.name);
    private pool: Pool;

    constructor() {
        this.pool = new Pool(DB_CONFIG);
    }

    /**
     * Resolves the EFFECTIVE Tier for a tenant.
     */
    async resolveTenantTier(tenantId: number): Promise<SubscriptionTier> {
        const client = await this.pool.connect();
        try {
            const res = await client.query(`
                SELECT p.tier_name 
                FROM subscriptions s
                JOIN plans p ON p.id = s.plan_id
                WHERE s.tenant_id = $1 
                  AND s.status IN ('ACTIVE', 'TRIALING', 'PAST_DUE')
                LIMIT 1
            `, [tenantId]);

            if (res.rows.length === 0) {
                return SubscriptionTier.BASIC;
            }

            const tierStr = res.rows[0].tier_name.toUpperCase();
            if (tierStr === 'PRO') return SubscriptionTier.PRO;
            if (tierStr === 'ENTERPRISE') return SubscriptionTier.ENTERPRISE;
            return SubscriptionTier.BASIC;

        } catch (error) {
            this.logger.error(`Failed to resolve tier for tenant ${tenantId}: ${error.message}`);
            return SubscriptionTier.BASIC;
        } finally {
            client.release();
        }
    }

    async checkUsageLimit(tenantId: number): Promise<boolean> {
        const client = await this.pool.connect();
        try {
            const res = await client.query(`
                SELECT usage_count, usage_limit, status, p.tier_name
                FROM subscriptions s
                JOIN plans p ON p.id = s.plan_id
                WHERE s.tenant_id = $1 AND s.status = 'ACTIVE'
            `, [tenantId]);

            if (res.rows.length === 0) return false;

            const sub = res.rows[0];
            if (sub.usage_limit === -1) return true;

            const usage = sub.usage_count || 0;
            return usage < sub.usage_limit;
        } finally {
            client.release();
        }
    }

    async incrementUsage(tenantId: number) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                UPDATE subscriptions 
                SET usage_count = usage_count + 1
                WHERE tenant_id = $1 AND status = 'ACTIVE'
            `, [tenantId]);
        } finally {
            client.release();
        }
    }

    async getSubscriptionStatus(tenantId: number) {
        const client = await this.pool.connect();
        try {
            const res = await client.query(`
                SELECT p.tier_name, s.usage_count, s.usage_limit, s.status
                FROM subscriptions s
                JOIN plans p ON p.id = s.plan_id
                WHERE s.tenant_id = $1 AND s.status = 'ACTIVE'
            `, [tenantId]);

            if (res.rows.length === 0) return { tier: 'BASIC', usage: 0, limit: 50 };
            return {
                tier: res.rows[0].tier_name,
                usage: res.rows[0].usage_count,
                limit: res.rows[0].usage_limit
            };
        } finally {
            client.release();
        }
    }

    async upgradeToPro(tenantId: number) {
        const client = await this.pool.connect();
        try {
            // Find PRO plan ID (assuming 2, but let's select)
            const planRes = await client.query("SELECT id FROM plans WHERE tier_name = 'PRO'");
            if (planRes.rows.length === 0) throw new Error('Pro Plan Not Found');
            const proId = planRes.rows[0].id;

            // Update Subscription
            await client.query(`
                UPDATE subscriptions 
                SET plan_id = $1, usage_limit = -1, usage_count = 0
                WHERE tenant_id = $2
            `, [proId, tenantId]);

            return { success: true, message: 'Upgraded to PRO' };
        } finally {
            client.release();
        }
    }
}
