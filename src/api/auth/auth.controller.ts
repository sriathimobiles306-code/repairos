
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminAuthService } from './admin-auth.service';
import { LoginDto, RegisterTenantDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly adminAuthService: AdminAuthService
    ) { }

    @Post('register')
    async register(@Body() dto: RegisterTenantDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Post('admin/login')
    @HttpCode(HttpStatus.OK)
    async adminLogin(@Body() dto: LoginDto) {
        // Reuse email field for username
        return this.adminAuthService.login(dto.email, dto.password);
    }
}
