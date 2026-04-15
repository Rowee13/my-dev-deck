import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { DemoService } from './demo.service';

/**
 * Demo-only endpoint for injecting a fake email into one of the caller's
 * projects. Demo users cannot receive real SMTP email (sandboxed), so they
 * click "Inject test email" in the UI which hits this endpoint.
 *
 * The global JwtAuthGuard populates `req.user` with `{ id, isDemo, ... }`;
 * `DemoService.injectTestEmail` enforces the `isDemo` check so that non-demo
 * callers receive 403 even though the route is authenticated.
 */
@ApiTags('demo')
@Controller('api/projects')
export class DemoEmailsController {
  constructor(private demo: DemoService) {}

  @Post(':id/demo/inject-email')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Inject a fake test email into a demo project' })
  async inject(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string; isDemo: boolean };
    return this.demo.injectTestEmail(user.id, user.isDemo, id);
  }
}
