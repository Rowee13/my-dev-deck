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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { EmailsService } from './emails.service';
import { Response } from 'express';
import * as fs from 'fs';

@ApiTags('emails')
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
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.emailsService.findAllByProject(
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
    @Param('projectId') projectId: string,
    @Param('emailId') emailId: string,
  ) {
    return this.emailsService.findOne(projectId, emailId);
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
    @Param('projectId') projectId: string,
    @Param('emailId') emailId: string,
    @Body('isRead') isRead: boolean,
  ) {
    return this.emailsService.markAsRead(projectId, emailId, isRead);
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
    @Param('projectId') projectId: string,
    @Param('emailId') emailId: string,
  ) {
    return this.emailsService.remove(projectId, emailId);
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
    @Param('attachmentId') attachmentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const attachment = await this.emailsService.getAttachment(attachmentId);

    const file = fs.createReadStream(attachment.storagePath);

    res.set({
      'Content-Type': attachment.contentType,
      'Content-Disposition': `attachment; filename="${attachment.filename}"`,
    });

    return new StreamableFile(file);
  }
}
