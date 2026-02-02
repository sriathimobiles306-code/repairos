import { Controller, Get, Post, Body, Param, UseGuards, Query, Delete, Patch, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreatePhoneDto } from './dto/admin.dto';
import { UserContext } from '../../shared/auth/auth.types';
import { User } from '../../shared/auth/user.decorator';
import { AdminGuard } from '../../shared/auth/admin-auth.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post('phones')
    async createPhone(@Body() dto: CreatePhoneDto, @User() user: UserContext) {
        return this.adminService.createPhone(dto.brand, dto.model, dto.aliases);
    }

    @Post('screens')
    async createScreen(@Body() dto: any, @User() user: UserContext) {
        return this.adminService.createScreen(dto);
    }

    @Get('stats')
    @Get('stats')
    async getStats(@User() user: UserContext) {
        return this.adminService.getStats();
    }

    @Get('rules')
    async getRules(@User() user: UserContext) {
        return this.adminService.getPendingRules();
    }

    @Post('rules/:id/approve')
    async approveRule(
        @Param('id') id: string,
        @User() user: UserContext
    ) {
        // RBAC check removed as per instruction, assuming it's handled elsewhere or not needed for this specific action
        return this.adminService.approveRule(parseInt(id, 10), user.userId);
    }

    @Delete('phones/:id')
    async deletePhone(@Param('id') id: string) {
        return this.adminService.deletePhone(parseInt(id, 10));
    }

    @Delete('screens/:id')
    async deleteScreen(@Param('id') id: string) {
        return this.adminService.deleteScreen(parseInt(id, 10));
    }

    @Get('unmapped-phones')
    async getUnmappedPhones(@User() user: UserContext) {
        return this.adminService.getUnmappedPhones();
    }

    @Get('all-screens')
    async getAllScreens(@User() user: UserContext) {
        return this.adminService.getAllScreens();
    }

    @Post('map-phone')
    async mapPhone(@Body() body: { modelId: number; screenId: number }, @User() user: UserContext) {
        return this.adminService.mapPhoneToScreen(body.modelId, body.screenId, user.userId);
    }

    @Post('import/phones')
    async importPhones(@Body() body: { phones: any[] }, @User() user: UserContext) {
        // Validation could be added here (max 500 items etc)
        return this.adminService.importPhones(body.phones);
    }

    @Patch('inventory/stock')
    async updateStock(@Body() body: { sku: string; qty: number }, @User() user: UserContext) {
        return this.adminService.updateStock(body.sku, body.qty);
    }

    @Get('inventory')
    async listInventory(@User() user: UserContext) {
        return this.adminService.listInventory();
    }
}
