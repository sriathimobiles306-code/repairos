// src/api/compatibility/compatibility.module.ts
import { Module } from '@nestjs/common';
import { CompatibilityController } from './compatibility.controller';
import { CompatibilityService } from './compatibility.service';

import { SharedModule } from '../../shared/shared.module';

@Module({
    controllers: [CompatibilityController],
    providers: [CompatibilityService],
})
export class CompatibilityModule { }
