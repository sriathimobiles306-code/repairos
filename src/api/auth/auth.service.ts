
import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { LoginDto, RegisterTenantDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    // START: In production, assume strict env var presence.
    // For scaffolding/demo convenience, fallback to a hardcoded dev secret.
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';
    private readonly SALT_ROUNDS = 10;

    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async register(dto: RegisterTenantDto) {
        // Transactional: Create Tenant -> Create User -> Create Subscription
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Check if user exists (Global check across tenants? No, schema says unique per tenant.
            // But for a SaaS, usually email is unique globally or we need a way to find tenant.
            // For this design, we create a NEW Tenant. So email uniqueness in `tenant_users` table 
            // is only enforced per tenant. 
            // HOWEVER, we probably don't want the same email owning 50 tenants easily without them knowing.
            // We'll proceed with standard creation.

            // 2. Create Tenant
            const tenantRes = await queryRunner.query(
                `INSERT INTO tenants (name, status) VALUES ($1, 'ACTIVE') RETURNING id`,
                [dto.businessName]
            );
            const tenantId = tenantRes[0].id;

            // 3. Hash Password
            const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

            // 4. Create User (Owner)
            const userRes = await queryRunner.query(
                `INSERT INTO tenant_users (tenant_id, email, password_hash, full_name, role) 
                 VALUES ($1, $2, $3, $4, 'OWNER') RETURNING id`,
                [tenantId, dto.email, hashedPassword, dto.fullName]
            );

            // 5. Create Default Subscription (Active / Basic)
            // Assuming we accept all registration as BASIC for now.
            // If we had a plans table populated, we'd lookup 'BASIC'.
            // For now, insert a placeholder subscription.
            // We need a PLAN ID. We'll check if plans exist, else insert a dummy one?
            // Safer: Insert a default plan if not exists within this transaction or assumed seeded.
            // Let's assume seeded or create on fly if empty (scaffold safety).

            let planRes = await queryRunner.query(`SELECT id FROM plans WHERE tier_name = 'BASIC'`);
            let planId;
            if (planRes.length === 0) {
                // Auto-seed basic plan if missing (Self-healing)
                const newPlan = await queryRunner.query(
                    `INSERT INTO plans (tier_name, features_json) VALUES ('BASIC', '{"universal_limit": 5}') RETURNING id`
                );
                planId = newPlan[0].id;
            } else {
                planId = planRes[0].id;
            }

            await queryRunner.query(
                `INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_start, current_period_end)
                 VALUES ($1, $2, 'ACTIVE', NOW(), NOW() + INTERVAL '30 days')`,
                [tenantId, planId]
            );

            await queryRunner.commitTransaction();

            // Auto-Login
            return this.generateToken(tenantId, userRes[0].id, 'OWNER');

        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error('Registration failed:', err);
            throw new InternalServerErrorException('Registration failed');
        } finally {
            await queryRunner.release();
        }
    }

    async login(dto: LoginDto) {
        // Multi-tenant Login Challenge: 
        // User provides Email + Password. We need to find WHICH tenant they belong to.
        // If email exists in multiple tenants, we'd need a "Select Tenant" flow.
        // MVP Strategy: Find the FIRST active user with this email. (Or restrict unique email globally).

        const users = await this.dataSource.query(
            `SELECT u.*, t.status as tenant_status 
             FROM tenant_users u
             JOIN tenants t ON u.tenant_id = t.id
             WHERE u.email = $1 AND u.is_active = TRUE`,
            [dto.email]
        );

        if (users.length === 0) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Ideally, if users.length > 1, throw "Ambiguous User" or return list.
        // For MVP, we take the first one.
        const user = users[0];

        if (user.tenant_status !== 'ACTIVE') {
            throw new UnauthorizedException('Tenant is suspended');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password_hash);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateToken(user.tenant_id, user.id, user.role);
    }

    private generateToken(tenantId: string, userId: string, role: string) {
        const payload = {
            tenant_id: tenantId,
            sub: userId,
            role: role
        };

        const token = jwt.sign(payload, this.JWT_SECRET, { expiresIn: '7d' });

        return {
            access_token: token,
            user: {
                id: userId,
                tenant_id: tenantId,
                role: role
            }
        };
    }
}
