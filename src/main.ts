import './dayjs-setup';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DateFormatInterceptor } from './common/interceptors/date-format.interceptor';

const getCorsOrigins = (): boolean | string[] => {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const rawOrigins = process.env.CORS_ORIGIN;

  if (!rawOrigins || rawOrigins.trim() === '') {
    return false;
  }

  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const shouldEnableSwagger = (): boolean => {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  return process.env.SWAGGER_ENABLED === 'true';
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const port = process.env.PORT ?? 3000;

  app.useLogger(app.get(Logger));

  app.enableCors({
    origin: getCorsOrigins(),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new DateFormatInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (shouldEnableSwagger()) {
    const config = new DocumentBuilder()
      .setTitle('Sistema de Medicamentos API')
      .setDescription('Backend API for a medication reminder mobile application.')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(port);
}

void bootstrap();