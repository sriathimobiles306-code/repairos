
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminAuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';

    constructor(@InjectDataSource() private readonly dataSource: DataSource) { }

    async login(username: string, pass: string) {
        const res = await this.dataSource.query(
            `SELECT * FROM administrators WHERE username = $1`,
            [username]
        );

        if (res.length === 0) throw new UnauthorizedException('Invalid Admin Credentials');
        const admin = res[0];

        const match = await bcrypt.compare(pass, admin.password_hash);
        if (!match) throw new UnauthorizedException('Invalid Admin Credentials');

        const token = jwt.sign({
            sub: admin.id,
            role: admin.role,
            tenant_id: admin.tenant_id,
            type: 'admin' // Distinct claim
        }, this.JWT_SECRET, { expiresIn: '12h' });

        return { access_token: token, role: admin.role };
    }

    async createInitialAdmin(username: string, pass: string, tenantId?: number) {
        const hash = await bcrypt.hash(pass, 10);
        await this.dataSource.query(
            `INSERT INTO administrators (username, password_hash, role, tenant_id) VALUES ($1, $2, 'SUPER_ADMIN', $3)`,
            [username, hash, tenantId || null]
        );
    }
}
