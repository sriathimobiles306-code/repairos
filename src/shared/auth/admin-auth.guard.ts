
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminGuard implements CanActivate {
    private readonly JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            console.log('AdminGuard: No Token Found');
            throw new UnauthorizedException('No Admin Token');
        }

        try {
            const payload: any = jwt.verify(token, this.JWT_SECRET);
            console.log('AdminGuard: Payload:', payload);

            // STRICT CHECK: Type must be 'admin'
            if (payload.type !== 'admin') {
                console.log('AdminGuard: Type Mismatch', payload.type);
                throw new UnauthorizedException('Access Denied: Not an Admin');
            }

            request['user'] = { ...payload, userId: payload.sub };
            return true;
        } catch (err) {
            console.log('AdminGuard: Verify Failed:', err.message);
            throw new UnauthorizedException('Invalid Admin Token');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
}
