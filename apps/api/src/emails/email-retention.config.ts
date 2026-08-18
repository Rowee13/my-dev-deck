import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailRetentionConfig {
  constructor(private config: ConfigService) {}

  // Days to keep captured emails. 0 (or less) disables retention sweeps.
  get retentionDays(): number {
    return parseInt(this.config.get('EMAIL_RETENTION_DAYS') || '7', 10);
  }
}
