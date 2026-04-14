import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';
import { BlockDemoGuard } from './block-demo.guard';
import { BLOCK_DEMO_KEY } from '../decorators/block-demo.decorator';

function ctx(user: { id: string; isDemo: boolean }, blocked: boolean) {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(blocked);
  const guard = new BlockDemoGuard(reflector);
  const exec = {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  return { guard, exec };
}

describe('BlockDemoGuard', () => {
  it('uses BLOCK_DEMO_KEY metadata key', () => {
    expect(BLOCK_DEMO_KEY).toBe('blockDemo');
  });

  it('allows non-demo users on blocked routes', () => {
    const { guard, exec } = ctx({ id: 'u', isDemo: false }, true);
    expect(guard.canActivate(exec)).toBe(true);
  });

  it('blocks demo users on blocked routes', () => {
    const { guard, exec } = ctx({ id: 'u', isDemo: true }, true);
    expect(() => guard.canActivate(exec)).toThrow(ForbiddenException);
  });

  it('allows demo users on non-blocked routes', () => {
    const { guard, exec } = ctx({ id: 'u', isDemo: true }, false);
    expect(guard.canActivate(exec)).toBe(true);
  });
});
