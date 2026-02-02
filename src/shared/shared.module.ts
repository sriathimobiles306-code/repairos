import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { SubscriptionService } from './subscription/subscription.service';
import { AuthGuard } from './auth/auth.guard';

const dbProvider = {
    provide: 'DATABASE_POOL',
    useFactory: () => {
        return new Pool({
            connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_2TK5hXYqIVri@ep-delicate-tree-aft7ig8b-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
            ssl: { rejectUnauthorized: false }
        });
    }
};

@Global()
@Module({
    providers: [SubscriptionService, AuthGuard, dbProvider],
    exports: [SubscriptionService, AuthGuard, dbProvider],
})
export class SharedModule { }
