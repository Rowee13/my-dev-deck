import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BLOCK_DEMO_KEY } from '../decorators/block-demo.decorator';

/**
 * Guard that blocks demo users from accessing routes decorated with `@BlockDemo()`.
 *
 * Invariant: this guard must run on any route where `@BlockDemo()` is applied.
 * It relies on `JwtAuthGuard` populating `req.user.isDemo`, but is now
 * self-contained: if `req.user` is missing on a blocked route, it fails
 * closed by throwing `UnauthorizedException`. This means APP_GUARD ordering
 * between this guard and `JwtAuthGuard` is no longer fragile — a blocked
 * route without an authenticated user will always be rejected.
 */
@Injectable()
export class BlockDemoGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const blocked = this.reflector.getAllAndOverride<boolean>(BLOCK_DEMO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!blocked) return true;
    const req = context
      .switchToHttp()
      .getRequest<{ user?: { isDemo?: boolean } }>();
    if (!req.user) {
      throw new UnauthorizedException('Authentication required');
    }
    if (req.user.isDemo) {
      throw new ForbiddenException('Not available in demo mode');
    }
    return true;
  }
}
