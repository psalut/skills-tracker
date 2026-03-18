/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { PrismaExceptionFilter } from './prisma/prisma-exception.filter';

const envFile =
  process.env.NODE_ENV === 'test'
    ? path.resolve(process.cwd(), '.env.test')
    : path.resolve(process.cwd(), '.env');

dotenv.config({ path: envFile });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remueve props extra
      forbidNonWhitelisted: true, // error si mandan props extra
      transform: true, // transforma payloads a DTO
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Skills Tracker API')
    .setDescription(
      [
        'API para autenticacion, usuarios y seguimiento de skills.',
        '',
        'Politica de autorizacion:',
        '- `POST /auth/register` crea usuarios con rol `USER`.',
        '- `ADMIN` puede listar usuarios y administrar el catalogo de skills.',
        '- Cada usuario puede leer y editar solo su propio perfil, salvo `ADMIN`.',
        '- Cada usuario solo puede gestionar sus propias `user-skills`.',
        '- `ADMIN` puede consultar las skills asignadas de otro usuario con `GET /users/:userId/skills`.',
        '- `ADMIN` no puede editar ni borrar `user-skills` ajenas.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Pega aca tu access token JWT',
      },
      'JWT-auth',
    )
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, documentFactory);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}

void bootstrap();
