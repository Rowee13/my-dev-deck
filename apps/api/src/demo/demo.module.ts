import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DemoConfig } from './demo.config';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, AuthModule],
  providers: [DemoConfig],
  controllers: [],
  exports: [DemoConfig],
})
export class DemoModule {}
