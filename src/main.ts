import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import * as session from 'express-session';
import { AppModule } from './app.module';
import { SentryInterceptor } from './shared/interceptor/sentry.interceptor';
var back = require('express-back');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  }))
  // sessions
  app.use(
    session({
      secret: 'my-secret',
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(back());
  // sentry
  Sentry.init({
    dsn: "https://a3f18568669c47b18fa49cc18e246128@o569539.ingest.sentry.io/5727071"
  })
  app.useGlobalInterceptors(new SentryInterceptor())
  // swagger
  const config = new DocumentBuilder()
    .setTitle('NNB API')
    .setDescription('The description of NNB API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, document);

  await app.listen(3000);
}
bootstrap();
