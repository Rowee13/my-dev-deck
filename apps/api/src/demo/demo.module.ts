import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DemoConfig } from './demo.config';
import { DemoController } from './demo.controller';
import { DemoSeeder } from './demo-seeder.interface';
import { DemoSeederRegistry } from './demo-seeder.registry';
import { DemoService } from './demo.service';
import { BlockDemoGuard } from './guards/block-demo.guard';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, AuthModule],
  providers: [
    DemoConfig,
    DemoService,
    {
      provide: DemoSeederRegistry,
      // Concrete seeders (DevInbox, etc.) will be appended to `inject` and the
      // factory signature as they are introduced in later tasks.
      useFactory: (...seeders: DemoSeeder[]) => new DemoSeederRegistry(seeders),
      inject: [],
    },
    { provide: APP_GUARD, useClass: BlockDemoGuard },
  ],
  controllers: [DemoController],
  exports: [DemoConfig, DemoSeederRegistry],
})
export class DemoModule {}
