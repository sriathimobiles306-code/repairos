// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from './shared/shared.module';
import { CompatibilityModule } from './api/compatibility/compatibility.module';
import { AuthModule } from './api/auth/auth.module';
import { AdminModule } from './api/admin/admin.module';
import { OrdersModule } from './api/orders/orders.module';
import { PartsModule } from './api/parts/parts.module';
import { SubscriptionModule } from './api/subscription/subscription.module';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
            ssl: { rejectUnauthorized: false },
            autoLoadEntities: false,
            synchronize: false,
        }),
        SharedModule,
        CompatibilityModule,
        AuthModule,
        AdminModule,
        OrdersModule,
        PartsModule,
        SubscriptionModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
