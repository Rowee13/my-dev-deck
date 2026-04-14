import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { DemoConfig } from './demo.config';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';

describe('DemoController', () => {
  const createdAt = new Date('2026-04-15T10:00:00.000Z');
  const user = {
    id: 'u1',
    email: 'demo-abcd1234@demo.local',
    name: 'Demo User',
    isDemo: true,
    createdAt,
  };
  const tokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: { id: user.id, email: user.email, name: user.name },
  };

  const makeModule = async (ttlMinutes = 60) => {
    const demo = {
      createDemoUser: jest.fn().mockResolvedValue(user),
    };
    const auth = {
      issueTokensForUser: jest.fn().mockResolvedValue(tokens),
      setAuthCookies: jest.fn(),
    };
    const config = { ttlMinutes };
    const module = await Test.createTestingModule({
      controllers: [DemoController],
      providers: [
        { provide: DemoService, useValue: demo },
        { provide: AuthService, useValue: auth },
        { provide: DemoConfig, useValue: config },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    return {
      ctrl: module.get(DemoController),
      demo,
      auth,
      config,
    };
  };

  it('creates a demo user, issues tokens, sets cookies, and returns user/tokens', async () => {
    const { ctrl, demo, auth } = await makeModule(60);
    const res = {} as Response;

    const result = await ctrl.createDemo(res);

    expect(demo.createDemoUser).toHaveBeenCalledTimes(1);
    expect(auth.issueTokensForUser).toHaveBeenCalledWith({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    expect(auth.setAuthCookies).toHaveBeenCalledWith(
      res,
      tokens.accessToken,
      tokens.refreshToken,
    );

    expect(result.accessToken).toBe(tokens.accessToken);
    expect(result.refreshToken).toBe(tokens.refreshToken);
    expect(result.user).toEqual(
      expect.objectContaining({
        id: user.id,
        email: user.email,
        name: user.name,
        isDemo: true,
        createdAt,
      }),
    );
  });

  it('computes expiresAt as createdAt + ttlMinutes*60_000', async () => {
    const ttlMinutes = 60;
    const { ctrl } = await makeModule(ttlMinutes);
    const res = {} as Response;

    const result = await ctrl.createDemo(res);

    const expected = new Date(createdAt.getTime() + ttlMinutes * 60_000);
    expect(result.user.expiresAt).toEqual(expected);
    expect(result.user.expiresAt.getTime()).toBe(
      createdAt.getTime() + ttlMinutes * 60_000,
    );
  });

  it('calls DemoService.createDemoUser before AuthService.issueTokensForUser before setAuthCookies', async () => {
    const { ctrl, demo, auth } = await makeModule(60);
    const order: string[] = [];
    demo.createDemoUser.mockImplementationOnce(async () => {
      order.push('create');
      return user;
    });
    auth.issueTokensForUser.mockImplementationOnce(async () => {
      order.push('issue');
      return tokens;
    });
    auth.setAuthCookies.mockImplementationOnce(() => {
      order.push('cookies');
    });

    await ctrl.createDemo({} as Response);

    expect(order).toEqual(['create', 'issue', 'cookies']);
  });
});
