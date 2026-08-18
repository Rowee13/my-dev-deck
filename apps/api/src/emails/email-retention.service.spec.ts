import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { EmailRetentionConfig } from './email-retention.config';
import { EmailRetentionService } from './email-retention.service';

describe('EmailRetentionService', () => {
  let service: EmailRetentionService;
  let prisma: {
    email: { findMany: jest.Mock; deleteMany: jest.Mock };
  };
  let config: { retentionDays: number };
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let unlinkSpy: jest.SpyInstance;

  beforeEach(() => {
    prisma = { email: { findMany: jest.fn(), deleteMany: jest.fn() } };
    config = { retentionDays: 7 };
    service = new EmailRetentionService(
      prisma as unknown as PrismaService,
      config as unknown as EmailRetentionConfig,
    );
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('is a no-op when retention is disabled', async () => {
    config.retentionDays = 0;

    await service.handleRetention();

    expect(prisma.email.findMany).not.toHaveBeenCalled();
    expect(prisma.email.deleteMany).not.toHaveBeenCalled();
  });

  it('deletes emails older than the retention cutoff', async () => {
    const fixedNow = new Date('2026-08-18T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(fixedNow);
    prisma.email.findMany.mockResolvedValue([
      { id: 'e1', attachments: [] },
      { id: 'e2', attachments: [] },
    ]);
    prisma.email.deleteMany.mockResolvedValue({ count: 2 });

    await service.handleRetention();

    const expectedCutoff = new Date(fixedNow.getTime() - 7 * 86_400_000);
    expect(prisma.email.findMany).toHaveBeenCalledWith({
      where: { receivedAt: { lt: expectedCutoff } },
      select: { id: true, attachments: { select: { storagePath: true } } },
    });
    expect(prisma.email.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['e1', 'e2'] } },
    });
    expect(logSpy).toHaveBeenCalledWith(
      'Deleted 2 email(s) older than 7 day(s)',
    );
  });

  it('unlinks attachment files before deleting the rows', async () => {
    prisma.email.findMany.mockResolvedValue([
      { id: 'e1', attachments: [{ storagePath: '/data/a.pdf' }] },
    ]);
    prisma.email.deleteMany.mockResolvedValue({ count: 1 });

    await service.handleRetention();

    expect(unlinkSpy).toHaveBeenCalledWith('/data/a.pdf');
  });

  it('still deletes rows when an attachment file is already gone', async () => {
    unlinkSpy.mockRejectedValue(new Error('ENOENT'));
    prisma.email.findMany.mockResolvedValue([
      { id: 'e1', attachments: [{ storagePath: '/data/missing.pdf' }] },
    ]);
    prisma.email.deleteMany.mockResolvedValue({ count: 1 });

    await service.handleRetention();

    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to delete attachment file: /data/missing.pdf',
    );
    expect(prisma.email.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['e1'] } },
    });
  });

  it('does nothing further when no emails have expired', async () => {
    prisma.email.findMany.mockResolvedValue([]);

    await service.handleRetention();

    expect(prisma.email.deleteMany).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });
});
