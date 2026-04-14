import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DemoConfig } from './demo.config';
import { DemoSeeder } from './demo-seeder.interface';
import { DemoSeederRegistry } from './demo-seeder.registry';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, AuthModule],
  providers: [
    DemoConfig,
    {
      provide: DemoSeederRegistry,
      // Concrete seeders (DevInbox, etc.) will be appended to `inject` and the
      // factory signature as they are introduced in later tasks.
      useFactory: (...seeders: DemoSeeder[]) => new DemoSeederRegistry(seeders),
      inject: [],
    },
  ],
  controllers: [],
  exports: [DemoConfig, DemoSeederRegistry],
})
export class DemoModule {}
