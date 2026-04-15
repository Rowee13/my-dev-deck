import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DemoConfig } from './demo.config';

@Injectable()
export class DemoCleanupService {
  private readonly logger = new Logger(DemoCleanupService.name);

  constructor(
    private prisma: PrismaService,
    private config: DemoConfig,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCleanup() {
    if (!this.config.enabled) return;
    const cutoff = new Date(Date.now() - this.config.ttlMinutes * 60_000);
    const result = await this.prisma.user.deleteMany({
      where: { isDemo: true, createdAt: { lt: cutoff } },
    });
    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired demo user(s)`);
    }
  }
}
