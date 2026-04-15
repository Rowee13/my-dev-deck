import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DemoConfig } from './demo.config';
import { DemoCleanupService } from './demo-cleanup.service';

describe('DemoCleanupService', () => {
  let service: DemoCleanupService;
  let prisma: { user: { deleteMany: jest.Mock } };
  let config: { enabled: boolean; ttlMinutes: number };
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    prisma = { user: { deleteMany: jest.fn() } };
    config = { enabled: false, ttlMinutes: 60 };
    service = new DemoCleanupService(
      prisma as unknown as PrismaService,
      config as unknown as DemoConfig,
    );
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    logSpy.mockRestore();
  });

  it('is a no-op when demo mode is disabled', async () => {
    config.enabled = false;

    await service.handleCleanup();

    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('deletes expired demo users using the ttl cutoff when enabled', async () => {
    config.enabled = true;
    config.ttlMinutes = 60;
    const fixedNow = new Date('2026-04-15T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(fixedNow);
    prisma.user.deleteMany.mockResolvedValue({ count: 3 });

    await service.handleCleanup();

    const expectedCutoff = new Date(fixedNow.getTime() - 60 * 60_000);
    expect(prisma.user.deleteMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.deleteMany).toHaveBeenCalledWith({
      where: { isDemo: true, createdAt: { lt: expectedCutoff } },
    });
    expect(logSpy).toHaveBeenCalledWith('Cleaned up 3 expired demo user(s)');
  });

  it('does not log when no rows are deleted', async () => {
    config.enabled = true;
    config.ttlMinutes = 30;
    prisma.user.deleteMany.mockResolvedValue({ count: 0 });

    await service.handleCleanup();

    expect(prisma.user.deleteMany).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });
});
