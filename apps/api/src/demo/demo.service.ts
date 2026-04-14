import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { DemoConfig } from './demo.config';
import { DemoSeederRegistry } from './demo-seeder.registry';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    private config: DemoConfig,
    private seeders: DemoSeederRegistry,
  ) {}

  /**
   * Create a passwordless demo user.
   *
   * The account receives a cryptographically random, never-returned password
   * so it cannot be logged into via the credentials flow. After creation, all
   * registered DemoSeeders run to populate tool-specific sample data.
   *
   * Throws NotFoundException (404) when DEMO_MODE_ENABLED is not 'true' so the
   * endpoint is indistinguishable from a non-existent route in production.
   */
  async createDemoUser() {
    if (!this.config.enabled) {
      throw new NotFoundException();
    }

    // Random 32-byte password (64 hex chars). Never returned, never reused.
    const unusablePassword = randomBytes(32).toString('hex');
    const hashed = await this.auth.hashPassword(unusablePassword);

    const user = await this.prisma.user.create({
      data: {
        email: `demo-${randomUUID().slice(0, 8)}@demo.local`,
        password: hashed,
        name: 'Demo User',
        isDemo: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isDemo: true,
        createdAt: true,
      },
    });

    await this.seeders.seedAll(user.id);

    this.logger.log(`Demo user created: ${user.id}`);
    return user;
  }
}
