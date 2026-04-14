import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BLOCK_DEMO_KEY } from '../decorators/block-demo.decorator';

@Injectable()
export class BlockDemoGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const blocked = this.reflector.getAllAndOverride<boolean>(BLOCK_DEMO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!blocked) return true;
    const req = context.switchToHttp().getRequest<{ user?: { isDemo?: boolean } }>();
    if (req.user?.isDemo) {
      throw new ForbiddenException('Not available in demo mode');
    }
    return true;
  }
}
