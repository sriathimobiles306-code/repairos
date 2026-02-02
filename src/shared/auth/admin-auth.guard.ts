
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminGuard implements CanActivate {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) throw new UnauthorizedException('No Admin Token');

        try {
            const payload: any = jwt.verify(token, this.JWT_SECRET);

            // STRICT CHECK: Type must be 'admin'
            if (payload.type !== 'admin') {
                throw new UnauthorizedException('Access Denied: Not an Admin');
            }

            request['user'] = { ...payload, userId: payload.sub }; // Map sub to userId for compatibility
            return true;
        } catch (err) {
            throw new UnauthorizedException('Invalid Admin Token');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
