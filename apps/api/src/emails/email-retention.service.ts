import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { EmailRetentionConfig } from './email-retention.config';

const DAY_MS = 86_400_000;

@Injectable()
export class EmailRetentionService {
  private readonly logger = new Logger(EmailRetentionService.name);

  constructor(
    private prisma: PrismaService,
    private config: EmailRetentionConfig,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleRetention() {
    const days = this.config.retentionDays;
    if (!days || days <= 0) return;

    const cutoff = new Date(Date.now() - days * DAY_MS);
    const expired = await this.prisma.email.findMany({
      where: { receivedAt: { lt: cutoff } },
      select: { id: true, attachments: { select: { storagePath: true } } },
    });

    if (expired.length === 0) return;

    // Attachment rows cascade with the email, but their files on the mounted
    // volume do not - remove them first so the volume does not leak.
    for (const email of expired) {
      for (const attachment of email.attachments) {
        try {
          await fs.promises.unlink(attachment.storagePath);
        } catch {
          this.logger.warn(
            `Failed to delete attachment file: ${attachment.storagePath}`,
          );
        }
      }
    }

    const result = await this.prisma.email.deleteMany({
      where: { id: { in: expired.map((email) => email.id) } },
    });

    this.logger.log(
      `Deleted ${result.count} email(s) older than ${days} day(s)`,
    );
  }
}
