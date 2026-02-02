// src/api/compatibility/compatibility.controller.ts

import { Controller, Get, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { CompatibilityService } from './compatibility.service';
import { CompatibilityCheckDto } from './compatibility.dto';
import { AuthGuard } from '../../shared/auth/auth.guard';
import { User } from '../../shared/auth/user.decorator';
import { UserContext } from '../../shared/auth/auth.types';
import { SubscriptionService } from '../../shared/subscription/subscription.service';
import { SubscriptionTier } from './compatibility.dto';

@UseGuards(AuthGuard)
@Controller('compatibility')
export class CompatibilityController {
    constructor(
        private readonly compatibilityService: CompatibilityService,
        private readonly subscriptionService: SubscriptionService,
    ) { }

    @Get()
    async checkUnprotected(
        @Query('brand') brand: string,
        @Query('model') model: string,
        @User() user: UserContext
    ) {
        if (!user) throw new Error('User context missing');
        if (typeof user.tenantId !== 'number') throw new Error('Invalid Tenant ID');

        // 1. Check Usage Limit
        const canProceed = await this.subscriptionService.checkUsageLimit(user.tenantId);
        if (!canProceed) {
            throw new BadRequestException('Free Plan Limit Reached (50 Searches). Upgrade to Pro.');
        }

        const tier = await this.subscriptionService.resolveTenantTier(user.tenantId);
        const result = await this.compatibilityService.checkCompatibility(
            { brand, model },
            tier,
            user.tenantId
        );

        // 2. Increment Usage (Fire & Forget mostly, or await)
        await this.subscriptionService.incrementUsage(user.tenantId);

        return result;
    }

    @Get('display')
    async checkDisplayCompat(
        @Query('source_brand') sourceBrand: string,
        @Query('source_model') sourceModel: string,
        @Query('target_brand') targetBrand: string,
        @Query('target_model') targetModel: string,
        @User() user: UserContext
    ) {
        // Enforce Usage Limit here too
        if (user && user.tenantId) {
            const canProceed = await this.subscriptionService.checkUsageLimit(user.tenantId);
            if (!canProceed) {
                throw new BadRequestException('Free Plan Limit Reached (50 Searches). Upgrade to Pro.');
            }
            await this.subscriptionService.incrementUsage(user.tenantId);
        }

        return this.compatibilityService.checkDisplayCompatibility(
            sourceBrand,
            sourceModel,
            targetBrand,
            targetModel
        );
    }
}
