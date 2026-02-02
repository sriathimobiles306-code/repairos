
import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SharedModule } from '../../shared/shared.module';

@Module({
    imports: [SharedModule],
    controllers: [SubscriptionController],
})
export class SubscriptionModule { }
