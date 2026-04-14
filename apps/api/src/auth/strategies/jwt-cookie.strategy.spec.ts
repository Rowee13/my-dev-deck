import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtCookieStrategy } from './jwt-cookie.strategy';
import { PrismaService } from '../../prisma/prisma.service';

describe('JwtCookieStrategy', () => {
  let strategy: JwtCookieStrategy;
  let prisma: { user: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn() } };
    const module = await Test.createTestingModule({
      providers: [
        JwtCookieStrategy,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: () => 'secret' } },
      ],
    }).compile();
    strategy = module.get(JwtCookieStrategy);
  });

  it('returns isDemo on the authenticated user', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.c',
      name: 'A',
      isDemo: true,
    });
    const result = await strategy.validate({ userId: 'u1', email: 'a@b.c' });
    expect(result).toEqual({
      id: 'u1',
      email: 'a@b.c',
      name: 'A',
      isDemo: true,
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u1' },
      select: { id: true, email: true, name: true, isDemo: true },
    });
  });
});
