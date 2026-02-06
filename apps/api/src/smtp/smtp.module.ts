import { Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { ProjectsModule } from '../projects/projects.module';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [ProjectsModule, EmailsModule],
  providers: [SmtpService],
  exports: [SmtpService],
})
export class SmtpModule {}
