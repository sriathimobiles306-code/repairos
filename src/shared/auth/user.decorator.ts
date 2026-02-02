// src/shared/auth/user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from './auth.types';

export const User = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): UserContext => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);
