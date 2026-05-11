import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Sistema de Medicamentos API')
    .setDescription('Documentación de la API del sistema de medicamentos')
    .setVersion('1.0')
    .addTag('Medicamentos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`Servidor corriendo en: http://localhost:${port}`);
  console.log(`Swagger disponible en: http://localhost:${port}/api/docs`);
}

bootstrap();