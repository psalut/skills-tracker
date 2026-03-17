# Skills Tracker

Aplicacion fullstack para registrar skills, organizarlas en una jerarquia y seguir el progreso de aprendizaje de cada usuario sobre una escala fija de niveles.

El repositorio esta montado como monorepo con Nx y separa frontend, API y pruebas e2e.

## Estado Actual

Hoy el proyecto ya incluye:

- autenticacion con JWT
- catalogo de skills con soft delete y soporte de sub-skills
- relacion `user-skill` para seguir progreso por usuario
- dashboard y pantallas principales protegidas por login
- documentacion Swagger para la API
- tests unitarios y e2e en backend
- tests frontend iniciales sobre `user-skills`

## Stack

### Frontend

- Angular 21
- standalone components
- signals
- Angular Router
- SCSS

### Backend

- NestJS 11
- Prisma
- PostgreSQL
- JWT con Passport
- Swagger

### Tooling

- Nx
- pnpm
- ESLint
- Prettier
- Husky
- lint-staged
- Vitest types para tests frontend
- Jest para backend
- Playwright configurado en el workspace

## Estructura

```text
apps/
  web/       Frontend Angular
  api/       Backend NestJS + Prisma
  api-e2e/   Pruebas e2e de la API
  web-e2e/   Base de pruebas e2e del frontend
```

## Modelo De Progreso

El sistema usa una escala fija y compartida para todas las skills:

- `BEGINNER`
- `BASIC`
- `INTERMEDIATE`
- `UPPER_INTERMEDIATE`
- `ADVANCED`
- `EXPERT`

No hay targets personalizados por skill o por usuario. El progreso se calcula siempre contra el nivel maximo `EXPERT`.

## Requisitos

- Node.js 20+
- pnpm
- PostgreSQL

## Variables De Entorno

Crea un archivo `.env` en la raiz del repo.

Ejemplo minimo:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/skills_tracker?schema=public"
JWT_SECRET="replace-with-a-secure-secret"
JWT_EXPIRES_IN="1h"
PORT="3000"
```

Notas:

- `DATABASE_URL` es obligatoria para Prisma.
- `JWT_SECRET` es obligatoria. La API falla al iniciar si no existe.
- Para tests e2e tambien se usa `.env.test` cuando `NODE_ENV=test`.

## Instalacion

```bash
pnpm install
```

## Base De Datos

Aplicar migraciones en desarrollo:

```bash
pnpm prisma:migrate:dev
```

Resetear la base de desarrollo:

```bash
pnpm prisma:reset:dev
```

## Ejecutar El Proyecto

Frontend:

```bash
pnpm exec nx serve web
```

Backend:

```bash
pnpm exec nx serve api
```

Por defecto:

- frontend: `http://localhost:4200`
- api: `http://localhost:3000`
- swagger: `http://localhost:3000/api/docs`

## Rutas Principales Del Frontend

- `/login`
- `/dashboard`
- `/skills`
- `/my-skills`
- `/profile`

Las rutas principales estan protegidas por autenticacion.

## Modulos Principales De La API

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Users

- `GET /users`
- `GET /users/:id`
- `PATCH /users/:id`

### Skills

- `POST /skills`
- `GET /skills`
- `GET /skills/roots`
- `GET /skills/:id`
- `PATCH /skills/:id`
- `DELETE /skills/:id`
- `PATCH /skills/:id/restore`

### User Skills

- `POST /user-skills`
- `GET /user-skills`
- `GET /user-skills/:id`
- `PATCH /user-skills/:id`
- `DELETE /user-skills/:id`
- `GET /users/:userId/skills`

## Testing

Backend unit tests:

```bash
pnpm exec nx test api
```

Frontend unit tests:

```bash
pnpm exec nx test web
```

API e2e:

```bash
pnpm exec nx test api-e2e
```

En este repo ya hay buena cobertura del backend y una base inicial de tests frontend centrados en `user-skills`.

## Formato Y Calidad

Formatear:

```bash
pnpm format
```

Verificar formato:

```bash
pnpm format:check
```

## Roadmap

Pendientes razonables del proyecto:

- ampliar cobertura frontend
- endurecer manejo de errores y feedback de UX
- completar la pantalla de perfil
- agregar autorizacion por roles si el dominio lo necesita
- sumar CI automatizada para lint, tests y build
- dockerizar el entorno

## Objetivo Del Proyecto

El repo funciona como laboratorio serio para practicar una base fullstack moderna con:

- arquitectura modular
- tipado estricto
- separacion clara entre frontend y backend
- validacion consistente en la API
- modelado de dominio incremental

## Licencia

Uso personal y educativo.
