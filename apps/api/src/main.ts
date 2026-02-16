import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as basicAuth from 'express-basic-auth';
import * as cookieParser from 'cookie-parser';
// import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parser - MUST be before CSRF middleware
  app.use(cookieParser());

  // CSRF Protection - disabled for now, will be enabled when frontend is ready
  // Uncomment below when ready:
  // import * as csurf from 'csurf';
  // const csrfProtection = csurf({
  //   cookie: { httpOnly: false, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' },
  // });
  // app.use(csrfProtection);

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  const corsOrigins = process.env.CORS_ORIGINS?.split(',');
  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true, // CRITICAL: Required for cookie-based auth
  });

  // Swagger Documentation with Basic Auth
  const swaggerUser = process.env.SWAGGER_USER || 'admin';
  const swaggerPassword = process.env.SWAGGER_PASSWORD || 'admin123';

  app.use(
    ['/api/docs', '/api/docs-json'],
    basicAuth({
      challenge: true,
      users: {
        [swaggerUser]: swaggerPassword,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('DevInbox API')
    .setDescription('DevInbox - Email testing tool for developers')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('projects', 'Project management endpoints')
    .addTag('emails', 'Email retrieval endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `Swagger docs available at: http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
  console.log(
    `Swagger credentials - User: ${swaggerUser}, Password: ${swaggerPassword}`,
  );
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
