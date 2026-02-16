import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Hybrid JWT Authentication Guard
 *
 * Supports both cookie-based and Bearer token authentication for gradual migration.
 * Tries strategies in this order:
 * 1. jwt-cookie (httpOnly cookie)
 * 2. jwt (Bearer token in Authorization header)
 *
 * This allows:
 * - New logins to use secure httpOnly cookies
 * - Existing sessions to continue with Bearer tokens
 * - Zero-downtime migration to cookie-based auth
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(['jwt-cookie', 'jwt']) {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Try both strategies: cookie first, then Bearer token
    return super.canActivate(context);
  }

  handleRequest<TUser = { id: string; email: string; name: string | null }>(
    err: Error | null,
    user: TUser | false,
  ): TUser {
    // If error or no user found with either strategy, throw unauthorized
    if (err || !user) {
      throw (
        err || new UnauthorizedException('Invalid or missing authentication')
      );
    }

    return user;
  }
}
