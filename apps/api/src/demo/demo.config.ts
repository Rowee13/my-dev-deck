import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DemoConfig {
  constructor(private config: ConfigService) {}

  get enabled(): boolean {
    return this.config.get('DEMO_MODE_ENABLED') === 'true';
  }

  get ttlMinutes(): number {
    return parseInt(this.config.get('DEMO_TTL_MINUTES') || '60', 10);
  }
}
