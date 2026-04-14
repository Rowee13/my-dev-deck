import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DemoService } from './demo.service';
import { DemoConfig } from './demo.config';
import { DemoSeederRegistry } from './demo-seeder.registry';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

describe('DemoService', () => {
  const makeModule = async (enabled: boolean) => {
    const createdUser = {
      id: 'u1',
      email: 'demo-abcd1234@demo.local',
      name: 'Demo User',
      isDemo: true,
      createdAt: new Date('2026-04-15T10:00:00.000Z'),
    };
    const prisma = {
      user: { create: jest.fn().mockResolvedValue(createdUser) },
    };
    const auth = {
      hashPassword: jest.fn().mockResolvedValue('hashed'),
      login: jest.fn(),
    };
    const registry = { seedAll: jest.fn().mockResolvedValue(undefined) };
    const config = { enabled, ttlMinutes: 60 };
    const module = await Test.createTestingModule({
      providers: [
        DemoService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: auth },
        { provide: DemoSeederRegistry, useValue: registry },
        { provide: DemoConfig, useValue: config },
      ],
    }).compile();
    return {
      svc: module.get(DemoService),
      prisma,
      auth,
      registry,
      createdUser,
    };
  };

  it('throws NotFound when demo mode disabled', async () => {
    const { svc, prisma, auth, registry } = await makeModule(false);
    await expect(svc.createDemoUser()).rejects.toThrow(NotFoundException);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(auth.hashPassword).not.toHaveBeenCalled();
    expect(registry.seedAll).not.toHaveBeenCalled();
  });

  it('creates a demo user with unusable password, isDemo=true, then seeds', async () => {
    const { svc, prisma, auth, registry } = await makeModule(true);
    const result = await svc.createDemoUser();

    expect(auth.hashPassword).toHaveBeenCalledTimes(1);
    // 32 random bytes => 64 hex characters
    const passwordArg = auth.hashPassword.mock.calls[0][0];
    expect(typeof passwordArg).toBe('string');
    expect(passwordArg).toMatch(/^[0-9a-f]{64}$/);

    expect(prisma.user.create).toHaveBeenCalledTimes(1);
    const createArg = prisma.user.create.mock.calls[0][0];
    expect(createArg.data.isDemo).toBe(true);
    expect(createArg.data.name).toBe('Demo User');
    expect(createArg.data.password).toBe('hashed');
    // Email format: demo-<8 chars>@demo.local
    expect(createArg.data.email).toMatch(/^demo-[0-9a-f]{8}@demo\.local$/);
    expect(createArg.select).toEqual(
      expect.objectContaining({
        id: true,
        email: true,
        name: true,
        isDemo: true,
        createdAt: true,
      }),
    );

    expect(registry.seedAll).toHaveBeenCalledWith('u1');
    expect(result.id).toBe('u1');
    expect(result.isDemo).toBe(true);
  });

  it('invokes seedAll AFTER the user is created', async () => {
    const { svc, prisma, registry } = await makeModule(true);
    const order: string[] = [];
    prisma.user.create.mockImplementationOnce(async () => {
      order.push('create');
      return {
        id: 'u1',
        email: 'demo-abcd1234@demo.local',
        name: 'Demo User',
        isDemo: true,
        createdAt: new Date(),
      };
    });
    registry.seedAll.mockImplementationOnce(async () => {
      order.push('seed');
    });
    await svc.createDemoUser();
    expect(order).toEqual(['create', 'seed']);
  });
});
