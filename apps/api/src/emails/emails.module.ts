import { Module } from '@nestjs/common';
import { EmailRetentionConfig } from './email-retention.config';
import { EmailRetentionService } from './email-retention.service';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';

@Module({
  controllers: [EmailsController],
  providers: [EmailsService, EmailRetentionConfig, EmailRetentionService],
  exports: [EmailsService],
})
export class EmailsModule {}
