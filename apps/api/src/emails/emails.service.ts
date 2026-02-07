import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ParsedMail } from 'mailparser';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private readonly uploadsDir: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'attachments');
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir() {
    try {
      await mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      this.logger.error('Error creating uploads directory:', error);
    }
  }

  async saveEmail(projectId: string, parsed: ParsedMail) {
    try {
      // Extract recipients
      const toValue = Array.isArray(parsed.to)
        ? parsed.to
        : parsed.to
          ? [parsed.to]
          : [];
      const toAddresses = toValue
        .flatMap((addr) => addr.value?.map((v) => v.address) || [])
        .filter((addr): addr is string => !!addr);

      // Save attachments first
      const attachments = await this.saveAttachments(parsed);

      // Create email record
      const email = await this.prisma.email.create({
        data: {
          projectId,
          from: parsed.from?.text || '',
          to: toAddresses,
          subject: parsed.subject || null,
          bodyText: parsed.text || null,
          bodyHtml: parsed.html || null,
          headers: parsed.headers as any,
          rawMime: parsed.text || null, // Store raw if needed
          attachments: {
            create: attachments.map((att) => ({
              filename: att.filename,
              contentType: att.contentType,
              size: att.size,
              storagePath: att.storagePath,
            })),
          },
        },
        include: {
          attachments: true,
        },
      });

      return email;
    } catch (error) {
      this.logger.error('Error saving email:', error);
      throw error;
    }
  }

  private async saveAttachments(parsed: ParsedMail): Promise<
    Array<{
      filename: string;
      contentType: string;
      size: number;
      storagePath: string;
    }>
  > {
    if (!parsed.attachments || parsed.attachments.length === 0) {
      return [];
    }

    const savedAttachments: Array<{
      filename: string;
      contentType: string;
      size: number;
      storagePath: string;
    }> = [];

    for (const attachment of parsed.attachments) {
      try {
        const filename = `${Date.now()}-${attachment.filename}`;
        const filepath = path.join(this.uploadsDir, filename);

        await writeFile(filepath, attachment.content);

        savedAttachments.push({
          filename: attachment.filename || 'unnamed',
          contentType: attachment.contentType,
          size: attachment.size,
          storagePath: filepath,
        });
      } catch (error) {
        this.logger.error(
          `Error saving attachment ${attachment.filename}:`,
          error,
        );
      }
    }

    return savedAttachments;
  }

  async findAllByProject(
    projectId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    const emails = await this.prisma.email.findMany({
      where: { projectId },
      orderBy: { receivedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: { attachments: true },
        },
      },
    });

    const total = await this.prisma.email.count({
      where: { projectId },
    });

    return {
      emails,
      total,
      limit,
      offset,
    };
  }

  async findOne(projectId: string, emailId: string) {
    const email = await this.prisma.email.findFirst({
      where: {
        id: emailId,
        projectId,
      },
      include: {
        attachments: true,
      },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    return email;
  }

  async markAsRead(projectId: string, emailId: string, isRead: boolean) {
    const email = await this.prisma.email.findFirst({
      where: {
        id: emailId,
        projectId,
      },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    return this.prisma.email.update({
      where: { id: emailId },
      data: { isRead },
    });
  }

  async remove(projectId: string, emailId: string) {
    const email = await this.prisma.email.findFirst({
      where: {
        id: emailId,
        projectId,
      },
      include: {
        attachments: true,
      },
    });

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    // Delete attachment files
    for (const attachment of email.attachments) {
      try {
        await fs.promises.unlink(attachment.storagePath);
      } catch (error) {
        this.logger.warn(
          `Failed to delete attachment file: ${attachment.storagePath}`,
        );
      }
    }

    await this.prisma.email.delete({
      where: { id: emailId },
    });

    return { message: 'Email deleted successfully' };
  }

  async getAttachment(attachmentId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }
}
