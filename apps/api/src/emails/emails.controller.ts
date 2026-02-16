import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Patch,
  Body,
  Res,
  StreamableFile,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EmailsService } from './emails.service';
import { Request, Response } from 'express';
import * as fs from 'fs';

@ApiTags('emails')
@ApiBearerAuth()
@Controller('api/projects/:projectId/emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all emails for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of emails to return',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of emails to skip',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated emails',
  })
  findAll(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.emailsService.findAllByProject(
      userId,
      projectId,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined,
    );
  }

  @Get(':emailId')
  @ApiOperation({ summary: 'Get email details' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'emailId', description: 'Email UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns email with attachments',
  })
  @ApiResponse({
    status: 404,
    description: 'Email not found',
  })
  findOne(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('emailId') emailId: string,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.emailsService.findOne(userId, projectId, emailId);
  }

  @Patch(':emailId/read')
  @ApiOperation({ summary: 'Mark email as read/unread' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'emailId', description: 'Email UUID' })
  @ApiResponse({
    status: 200,
    description: 'Email updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Email not found',
  })
  markAsRead(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('emailId') emailId: string,
    @Body('isRead') isRead: boolean,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.emailsService.markAsRead(userId, projectId, emailId, isRead);
  }

  @Delete(':emailId')
  @ApiOperation({ summary: 'Delete email' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'emailId', description: 'Email UUID' })
  @ApiResponse({
    status: 200,
    description: 'Email deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Email not found',
  })
  remove(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('emailId') emailId: string,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.emailsService.remove(userId, projectId, emailId);
  }

  @Get(':emailId/attachments/:attachmentId')
  @ApiOperation({ summary: 'Download email attachment' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'emailId', description: 'Email UUID' })
  @ApiParam({ name: 'attachmentId', description: 'Attachment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Returns attachment file',
  })
  @ApiResponse({
    status: 404,
    description: 'Attachment not found',
  })
  async downloadAttachment(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('attachmentId') attachmentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = (req.user as { id: string }).id;
    const attachment = await this.emailsService.getAttachment(
      userId,
      projectId,
      attachmentId,
    );

    const file = fs.createReadStream(attachment.storagePath);

    res.set({
      'Content-Type': attachment.contentType,
      'Content-Disposition': `attachment; filename="${attachment.filename}"`,
    });

    return new StreamableFile(file);
  }
}
