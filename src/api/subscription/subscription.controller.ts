
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../shared/auth/auth.guard';
import { SubscriptionService } from '../../shared/subscription/subscription.service';
import { User } from '../../shared/auth/user.decorator';
import { UserContext } from '../../shared/auth/auth.types';

@Controller('subscription')
export class SubscriptionController {
    constructor(private readonly subService: SubscriptionService) { }

    @Get('status')
    @UseGuards(AuthGuard)
    async getStatus(@User() user: UserContext) {
        return this.subService.getSubscriptionStatus(user.tenantId);
    }

    @Post('upgrade')
    @UseGuards(AuthGuard)
    async upgrade(@User() user: UserContext) {
        return this.subService.upgradeToPro(user.tenantId);
    }
}
