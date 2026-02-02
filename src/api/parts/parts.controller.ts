
import { Controller, Get, Post, Body, Param, Query, UseGuards, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PartsService } from './parts.service';
import { AdminGuard } from '../../shared/auth/admin-auth.guard';
import { AuthGuard } from '../../shared/auth/auth.guard';
import { SubscriptionService } from '../../shared/subscription/subscription.service';
import { User } from '../../shared/auth/user.decorator';
import { UserContext } from '../../shared/auth/auth.types';
import { SubscriptionTier } from '../compatibility/compatibility.dto';

@Controller('parts')
export class PartsController {
    constructor(
        private readonly partsService: PartsService,
        private readonly subService: SubscriptionService
    ) { }

    @Get('search')
    @UseGuards(AuthGuard)
    async search(@Query('q') q: string, @User() user: UserContext) {
        // Enforce PRO Tier
        const tier = await this.subService.resolveTenantTier(user.tenantId);
        if (tier !== SubscriptionTier.PRO && tier !== SubscriptionTier.ENTERPRISE) {
            throw new ForbiddenException('Part Finder is a PRO feature. Please upgrade.');
        }

        return this.partsService.searchParts(q);
    }

    @Get(':id/compatibility')
    @UseGuards(AuthGuard)
    async getCompatibility(@Param('id') id: number, @User() user: UserContext) {
        // Compatibility Check is allowed for Free users, but subject to 50 search limit.
        // 1. Check Usage Limit
        const canProceed = await this.subService.checkUsageLimit(user.tenantId);
        if (!canProceed) {
            throw new ForbiddenException('Limit Reached (50 Searches). Upgrade to Pro.');
        }

        // 2. Increment Usage
        await this.subService.incrementUsage(user.tenantId);

        return this.partsService.getPartCompatibility(id);
    }

    @Get('search/model')
    @UseGuards(AuthGuard)
    async searchModel(@Query('q') q: string, @User() user: UserContext) {
        // Enforce PRO Tier
        const tier = await this.subService.resolveTenantTier(user.tenantId);
        if (tier !== SubscriptionTier.PRO && tier !== SubscriptionTier.ENTERPRISE) {
            throw new ForbiddenException('Part Finder is a PRO feature. Please upgrade.');
        }

        return this.partsService.getPartsByModel(q);
    }

    // Admin Only: Add new parts
    @Post()
    @UseGuards(AdminGuard)
    async createPart(@Body() body: { code: string; desc: string; category: string }) {
        return this.partsService.createPart(body.code, body.desc, body.category);
    }

    // Admin Only: Link part to model
    @Post(':id/link')
    @UseGuards(AdminGuard)
    async linkModel(
        @Param('id') id: number,
        @Body() body: { brand: string; model: string; notes?: string }
    ) {
        return this.partsService.addCompatibility(id, body.brand, body.model, body.notes);
    }
}
