import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { DemoSeeder } from '../demo-seeder.interface';
import { SAMPLE_EMAILS } from './sample-emails';

/**
 * Seeds a "Demo Inbox" project with a handful of clearly-fake sample emails
 * so new demo users have something to explore in the DevInbox UI.
 *
 * Note: the Project model's `slug` column is globally `@unique`, so the slug
 * is suffixed with 6 chars of a UUID to keep per-demo-user seeds collision-free.
 */
@Injectable()
export class DevInboxDemoSeeder implements DemoSeeder {
  constructor(private prisma: PrismaService) {}

  async seed(userId: string): Promise<void> {
    const suffix = randomUUID().slice(0, 6);
    const project = await this.prisma.project.create({
      data: {
        userId,
        slug: `demo-inbox-${suffix}`,
        name: 'Demo Inbox',
        description:
          'Your personal demo project. Explore — this is temporary.',
      },
    });

    await this.prisma.email.createMany({
      data: SAMPLE_EMAILS.map((sample) => ({
        projectId: project.id,
        from: sample.from,
        to: sample.to,
        subject: sample.subject,
        bodyText: sample.bodyText,
        bodyHtml: sample.bodyHtml,
        headers: sample.headers,
      })),
    });
  }
}
