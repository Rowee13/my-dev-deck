import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { DemoConfig } from './demo.config';
import { DemoSeederRegistry } from './demo-seeder.registry';
import {
  INJECT_DOMAIN,
  INJECTABLE_EMAILS,
} from './seeders/injectable-emails';

/**
 * Max number of *injected* test emails allowed per project for demo users.
 * Seeded sample emails (from `@example.com`) do NOT count against this cap —
 * only rows whose `from` ends in `@inject.demo.local` do.
 */
const INJECT_EMAIL_CAP = 20;

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

  /**
   * Inject a realistic fake email into one of the demo user's projects.
   *
   * Demo accounts cannot receive real SMTP mail (L2 sandbox), so this endpoint
   * drops a randomly-picked template from `INJECTABLE_EMAILS` into the given
   * project. Caps at 20 injected emails per project.
   *
   * Cap accounting: we count rows whose `from` ends in `@inject.demo.local`
   * (the reserved marker domain used by every template in the pool). This
   * avoids a schema change and keeps seeded sample emails (from `@example.com`)
   * out of the count. Self-documenting when inspecting the DB.
   *
   * Ownership check is inlined (single `findFirst`) rather than depending on
   * ProjectsService to avoid cross-module coupling in DemoModule.
   */
  async injectTestEmail(userId: string, isDemo: boolean, projectId: string) {
    if (!isDemo) {
      throw new ForbiddenException(
        'Only demo accounts can inject test emails.',
      );
    }

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    const injectedCount = await this.prisma.email.count({
      where: {
        projectId,
        from: { endsWith: INJECT_DOMAIN },
      },
    });
    if (injectedCount >= INJECT_EMAIL_CAP) {
      throw new ForbiddenException(
        `Demo projects are limited to ${INJECT_EMAIL_CAP} injected test emails. Sign up to remove the cap.`,
      );
    }

    const template =
      INJECTABLE_EMAILS[Math.floor(Math.random() * INJECTABLE_EMAILS.length)];

    const email = await this.prisma.email.create({
      data: {
        projectId,
        from: template.from,
        to: template.to,
        subject: template.subject,
        bodyText: template.bodyText,
        bodyHtml: template.bodyHtml,
        headers: template.headers,
      },
    });

    this.logger.log(
      `Injected test email ${email.id} into project ${projectId} (user ${userId})`,
    );
    return email;
  }
}
