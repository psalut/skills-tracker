import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  getApiHost,
  getApiPort,
  getRequiredEnv,
  getWebOrigins,
  loadWorkspaceEnv,
  resolveWorkspaceEnvironment,
} from '@workspace-env';
import { AppModule } from './app/app.module';
import { PrismaExceptionFilter } from './prisma/prisma-exception.filter';

loadWorkspaceEnv({
  environment: resolveWorkspaceEnvironment(process.env.NODE_ENV),
});

async function bootstrap() {
  getRequiredEnv('DATABASE_URL');
  getRequiredEnv('JWT_SECRET');

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: getWebOrigins(),
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

  const host = getApiHost();
  const port = getApiPort();

  if (host) {
    await app.listen(port, host);
  } else {
    await app.listen(port);
  }
}

void bootstrap();
