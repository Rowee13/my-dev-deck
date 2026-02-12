import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMTPServer, SMTPServerSession } from 'smtp-server';
import { simpleParser, ParsedMail } from 'mailparser';
import { ProjectsService } from '../projects/projects.service';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class SmtpService implements OnModuleInit {
  private readonly logger = new Logger(SmtpService.name);
  private server: SMTPServer;

  constructor(
    private configService: ConfigService,
    private projectsService: ProjectsService,
    private emailsService: EmailsService,
  ) {}

  onModuleInit() {
    this.startServer();
  }

  private startServer() {
    const port = this.configService.get<number>('SMTP_PORT', 2525);
    const domain = this.configService.get<string>(
      'SMTP_DOMAIN',
      'devinbox.local',
    );

    this.server = new SMTPServer({
      authOptional: true,
      disabledCommands: ['AUTH'],
      onRcptTo: (address, session, callback) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.handleRecipient(address.address, callback);
      },
      onData: (stream, session, callback) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.handleData(stream, session, callback);
      },
    });

    this.server.listen(port, () => {
      this.logger.log(`SMTP Server listening on port ${port}`);
      this.logger.log(`Accepting emails for *@*.${domain}`);
    });

    this.server.on('error', (err) => {
      this.logger.error('SMTP Server error:', err);
    });
  }

  private async handleRecipient(
    address: string,
    callback: (err?: Error | null) => void,
  ) {
    try {
      // Extract project slug from email address
      // Format: anything@project-slug.devinbox.local
      const domain = this.configService.get<string>(
        'SMTP_DOMAIN',
        'devinbox.local',
      );
      const match = address.match(
        new RegExp(`^.+@(.+)\\.${domain.replace(/\./g, '\\.')}$`),
      );

      if (!match) {
        this.logger.warn(`Invalid email format: ${address}`);
        return callback(new Error('Invalid recipient domain'));
      }

      const projectSlug = match[1];
      const project = await this.projectsService.findBySlugPublic(projectSlug);

      if (!project) {
        this.logger.warn(`Project not found for slug: ${projectSlug}`);
        return callback(new Error('Project not found'));
      }

      this.logger.log(
        `Accepted recipient: ${address} for project: ${project.name}`,
      );
      callback();
    } catch (error) {
      this.logger.error('Error validating recipient:', error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      callback(error);
    }
  }

  private async handleData(
    stream: any,
    session: SMTPServerSession,
    callback: (err?: Error | null) => void,
  ) {
    try {
      // Parse the email
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const parsed: ParsedMail = await simpleParser(stream);

      this.logger.log(
        `Received email: ${parsed.subject} from ${parsed.from?.text}`,
      );

      // Extract project slug from first recipient
      const toValue = Array.isArray(parsed.to)
        ? parsed.to
        : parsed.to
          ? [parsed.to]
          : [];
      const firstRecipient = toValue[0]?.value?.[0]?.address || '';
      const domain = this.configService.get<string>(
        'SMTP_DOMAIN',
        'devinbox.local',
      );
      const match = firstRecipient.match(
        new RegExp(`^.+@(.+)\\.${domain.replace(/\./g, '\\.')}$`),
      );

      if (!match) {
        return callback(new Error('Invalid recipient domain'));
      }

      const projectSlug = match[1];
      const project = await this.projectsService.findBySlugPublic(projectSlug);

      if (!project) {
        return callback(new Error('Project not found'));
      }

      // Save email
      await this.emailsService.saveEmail(project.id, parsed);

      this.logger.log(`Email saved for project: ${project.name}`);
      callback();
    } catch (error) {
      this.logger.error('Error processing email:', error);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      callback(error);
    }
  }
}
