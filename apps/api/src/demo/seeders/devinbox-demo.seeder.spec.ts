import { Test } from '@nestjs/testing';
import { DevInboxDemoSeeder } from './devinbox-demo.seeder';
import { PrismaService } from '../../prisma/prisma.service';

describe('DevInboxDemoSeeder', () => {
  it('creates the demo-inbox project and 5 emails', async () => {
    const prisma = {
      project: {
        create: jest.fn().mockResolvedValue({ id: 'p1', slug: 'demo-inbox' }),
      },
      email: { createMany: jest.fn().mockResolvedValue({ count: 5 }) },
    };
    const module = await Test.createTestingModule({
      providers: [
        DevInboxDemoSeeder,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    await module.get(DevInboxDemoSeeder).seed('user-1');
    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          name: 'Demo Inbox',
          slug: expect.stringMatching(/^demo-inbox-[a-f0-9]{6}$/),
        }),
      }),
    );
    expect(prisma.email.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([expect.any(Object)]),
      }),
    );
    const createManyCall = prisma.email.createMany.mock.calls[0][0];
    expect(createManyCall.data).toHaveLength(5);
    for (const email of createManyCall.data) {
      expect(email.projectId).toBe('p1');
      expect(email.headers).toBeTruthy();
    }
  });
});
