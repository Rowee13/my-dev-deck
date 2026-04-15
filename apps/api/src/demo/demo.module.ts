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
import { DevInboxDemoSeeder } from './seeders/devinbox-demo.seeder';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, AuthModule],
  providers: [
    DemoConfig,
    DemoService,
    DevInboxDemoSeeder,
    {
      provide: DemoSeederRegistry,
      // Concrete seeders are appended to `inject` as they are introduced.
      // The factory receives them in the same order and forwards the list
      // to the registry.
      useFactory: (...seeders: DemoSeeder[]) => new DemoSeederRegistry(seeders),
      inject: [DevInboxDemoSeeder],
    },
    { provide: APP_GUARD, useClass: BlockDemoGuard },
  ],
  controllers: [DemoController],
  exports: [DemoConfig, DemoSeederRegistry],
})
export class DemoModule {}
