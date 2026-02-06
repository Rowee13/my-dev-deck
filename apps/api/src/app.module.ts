import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { EmailsModule } from './emails/emails.module';
import { SmtpModule } from './smtp/smtp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    ProjectsModule,
    EmailsModule,
    SmtpModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
