import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService.getCurrentUser', () => {
  const createdAt = new Date('2026-04-15T10:00:00.000Z');
  const updatedAt = new Date('2026-04-15T10:05:00.000Z');

  const makeService = async (userRow: any) => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(userRow) },
    };
    const jwt = {};
    const config = { get: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    return { svc: module.get(AuthService), prisma };
  };

  afterEach(() => {
    delete process.env.DEMO_TTL_MINUTES;
  });

  it('throws UnauthorizedException when user does not exist', async () => {
    const { svc } = await makeService(null);
    await expect(svc.getCurrentUser('missing')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('returns user without expiresAt for non-demo users', async () => {
    const { svc } = await makeService({
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      isDemo: false,
      createdAt,
      updatedAt,
    });
    const result = await svc.getCurrentUser('u1');
    expect(result).toEqual({
      id: 'u1',
      email: 'alice@example.com',
      name: 'Alice',
      isDemo: false,
      createdAt,
      updatedAt,
    });
    expect((result as any).expiresAt).toBeUndefined();
  });

  it('returns expiresAt = createdAt + ttlMinutes*60000 for demo users', async () => {
    process.env.DEMO_TTL_MINUTES = '45';
    const { svc } = await makeService({
      id: 'u2',
      email: 'demo-abcd1234@demo.local',
      name: 'Demo User',
      isDemo: true,
      createdAt,
      updatedAt,
    });
    const result: any = await svc.getCurrentUser('u2');
    expect(result.isDemo).toBe(true);
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBe(
      createdAt.getTime() + 45 * 60_000,
    );
  });

  it('defaults ttlMinutes to 60 when DEMO_TTL_MINUTES unset', async () => {
    const { svc } = await makeService({
      id: 'u3',
      email: 'demo-zzzz1111@demo.local',
      name: 'Demo User',
      isDemo: true,
      createdAt,
      updatedAt,
    });
    const result: any = await svc.getCurrentUser('u3');
    expect(result.expiresAt.getTime()).toBe(
      createdAt.getTime() + 60 * 60_000,
    );
  });
});
