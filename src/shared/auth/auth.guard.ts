// src/shared/auth/auth.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
    // Should match AuthService secret
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('No auth token provided');
        }

        try {
            // VERIFY SIGNATURE using jsonwebtoken
            const payload = jwt.verify(token, this.JWT_SECRET);

            // Attach to Request
            request['user'] = payload;

            return true;
        } catch (err) {
            throw new UnauthorizedException('Invalid or expired auth token');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
