
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthService } from './admin-auth.service';

@Module({
    controllers: [AuthController],
    providers: [AuthService, AdminAuthService],
    exports: [AuthService, AdminAuthService],
})
export class AuthModule { }
