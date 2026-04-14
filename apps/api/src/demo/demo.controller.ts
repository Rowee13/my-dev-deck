import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/decorators/public.decorator';
import { DemoConfig } from './demo.config';
import { DemoService } from './demo.service';

@ApiTags('auth')
@Controller('api/auth')
export class DemoController {
  constructor(
    private demo: DemoService,
    private auth: AuthService,
    private config: DemoConfig,
  ) {}

  @Public()
  @Post('demo')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 2, ttl: 60 * 60 * 1000 } })
  @ApiOperation({ summary: 'Create a passwordless demo account' })
  async createDemo(@Res({ passthrough: true }) res: Response) {
    const user = await this.demo.createDemoUser();
    const tokens = await this.auth.issueTokensForUser({
      id: user.id,
      email: user.email,
      name: user.name,
    });
    this.auth.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    const ttlMinutes = this.config.ttlMinutes;
    const expiresAt = new Date(
      user.createdAt.getTime() + ttlMinutes * 60_000,
    );
    return {
      user: { ...user, expiresAt },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
