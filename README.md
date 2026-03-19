# Skills Tracker

Aplicacion fullstack para registrar skills, organizarlas en una jerarquia y seguir el progreso de aprendizaje de cada usuario sobre una escala fija de niveles.

El repositorio esta montado como monorepo con Nx y separa frontend, API y pruebas e2e.

## Autorizacion

La API maneja dos roles:

- `USER`
- `ADMIN`

Reglas actuales:

- `POST /auth/register` siempre crea usuarios con rol `USER`
- un `USER` solo puede leer y editar su propio perfil
- un `USER` puede leer el catalogo de skills si esta autenticado
- un `USER` solo puede gestionar sus propias relaciones `user-skills`
- un `ADMIN` puede listar usuarios y leer perfiles de otros usuarios
- un `ADMIN` puede administrar el catalogo de `skills`
- un `ADMIN` puede consultar las `user-skills` de otro usuario
- un `ADMIN` no puede editar ni borrar `user-skills` ajenas; el progreso sigue siendo propiedad del usuario

Resumen por modulo:

- `Users`
- `GET /users`: solo `ADMIN`
- `GET /users/:id`: propietario del perfil o `ADMIN`
- `PATCH /users/:id`: propietario del perfil o `ADMIN`
- `Skills`
- `GET /skills`, `GET /skills/roots`, `GET /skills/:id`: cualquier usuario autenticado
- `POST /skills`, `PATCH /skills/:id`, `DELETE /skills/:id`, `PATCH /skills/:id/restore`: solo `ADMIN`
- `User Skills`
- `POST /user-skills`, `GET /user-skills`, `GET /user-skills/:id`, `PATCH /user-skills/:id`, `DELETE /user-skills/:id`: solo sobre recursos propios
- `GET /users/:userId/skills`: propio usuario o `ADMIN`

## Estado Actual

Hoy el proyecto ya incluye:

- autenticacion con JWT
- catalogo de skills con soft delete y soporte de sub-skills
- relacion `user-skill` para seguir progreso por usuario
- dashboard y pantallas principales protegidas por login
- documentacion Swagger para la API
- tests unitarios y e2e en backend
- tests unitarios frontend sobre login, guards, dashboard, skills, profile y `user-skills`
- tests e2e frontend con Playwright sobre login, dashboard, skills y profile
- configuracion centralizada de entorno para `api`, Prisma, `api-e2e` y `web-e2e`
- runtime config y proxy de desarrollo para controlar el target de la API en entornos locales
- CI con validacion automatica de formato, lint, tests unitarios, build, `api-e2e` y `web-e2e` en Chromium

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
- Vitest para tests frontend
- Jest para backend
- Playwright para e2e frontend

## Estructura

```text
apps/
  web/       Frontend Angular
  api/       Backend NestJS + Prisma
  api-e2e/   Pruebas e2e de la API
  web-e2e/   Pruebas e2e del frontend con Playwright
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

Usa:

- `.env.example` para desarrollo local
- `.env.test.example` para el entorno de tests backend e2e

Variables principales en desarrollo:

```env
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/skills_tracker?schema=public"
DATABASE_DIRECT_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/skills_tracker?schema=public"
JWT_SECRET="replace-with-a-secure-secret"
JWT_EXPIRES_IN="1h"
API_HOST="127.0.0.1"
API_PORT="3000"
WEB_PORT="4200"
WEB_ORIGIN="http://localhost:4200,http://127.0.0.1:4200"
```

Variables principales en test:

```env
DATABASE_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/skills_tracker_test"
DATABASE_DIRECT_URL="postgresql://USER:PASSWORD@127.0.0.1:5432/skills_tracker_test"
NEON_TEST_HOST_HINT="127.0.0.1:5432"
JWT_SECRET="replace-with-a-secure-secret"
JWT_EXPIRES_IN="1h"
HOST="127.0.0.1"
E2E_API_PORT="3333"
E2E_BASE_URL="http://127.0.0.1:3333"
```

Notas:

- `DATABASE_URL` es obligatoria para Prisma.
- `JWT_SECRET` es obligatoria. La API falla al iniciar si no existe.
- En desarrollo, `pnpm run dev:web` usa el proxy de Angular para redirigir `/api` al backend local.
- El frontend tambien expone `window.__SKILLS_TRACKER_CONFIG__.apiBaseUrl` mediante `runtime-config.js`.
- En builds estaticos, si `runtime-config.js` no define `apiBaseUrl`, el frontend usa `/api` como fallback.
- Si tu demo publica usa frontend y API en dominios distintos, debes publicar `runtime-config.js` con la URL completa de tu API desplegada.
- Ejemplo:

```js
window.__SKILLS_TRACKER_CONFIG__ = {
  apiBaseUrl: 'https://your-api-domain.example.com',
};
```

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

## Deploy De La API

Para produccion, este repo queda preparado para desplegar la API en Render usando el archivo [`render.yaml`](/c:/Users/pablo/Desktop/SKILLS/skills-tracker/render.yaml).

Configuracion esperada:

- `Build Command`: `pnpm install --frozen-lockfile && pnpm exec prisma generate && pnpm exec nx build api`
- `Pre-Deploy Command`: `DATABASE_URL=$DATABASE_DIRECT_URL pnpm exec prisma migrate deploy`
- `Start Command`: `node dist/api/main.js`
- `Health Check Path`: `/`

Variables requeridas en produccion:

```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
DATABASE_DIRECT_URL="postgresql://..."
JWT_SECRET="replace-with-a-secure-secret"
JWT_EXPIRES_IN="1h"
WEB_ORIGIN="https://your-frontend-domain.example.com"
```

Notas:

- `DATABASE_URL` debe ser la URL pooled de Neon para la aplicacion.
- `DATABASE_DIRECT_URL` debe ser la URL directa de Neon y solo se usa en el paso de migraciones.
- Render expone `PORT` automaticamente y la API ya lo soporta.
- Si todavia no tenes frontend publicado, podes usar temporalmente el dominio final que vayas a asignar o actualizar `WEB_ORIGIN` despues.

## Ejecutar El Proyecto

Frontend:

```bash
pnpm run dev:web
```

Backend:

```bash
pnpm run dev:api
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

Permisos:

- `GET /users`: solo `ADMIN`
- `GET /users/:id`: el propio usuario o `ADMIN`
- `PATCH /users/:id`: el propio usuario o `ADMIN`

### Skills

- `POST /skills`
- `GET /skills`
- `GET /skills/roots`
- `GET /skills/:id`
- `PATCH /skills/:id`
- `DELETE /skills/:id`
- `PATCH /skills/:id/restore`

Permisos:

- lectura de skills: cualquier usuario autenticado
- escritura de skills: solo `ADMIN`

### User Skills

- `POST /user-skills`
- `GET /user-skills`
- `GET /user-skills/:id`
- `PATCH /user-skills/:id`
- `DELETE /user-skills/:id`
- `GET /users/:userId/skills`

Permisos:

- un `USER` solo puede gestionar sus propias `user-skills`
- un `ADMIN` puede consultar `GET /users/:userId/skills`
- un `ADMIN` no puede editar ni borrar `user-skills` ajenas

## Testing

Backend unit tests:

```bash
pnpm exec nx test api
```

Frontend unit tests:

```bash
pnpm exec nx test web
```

API end-to-end tests:

```bash
pnpm run test:api:e2e
```

Frontend end-to-end tests:

```bash
pnpm run test:web:e2e
```

En CI la suite `web-e2e` se ejecuta en Chromium para mantener el tiempo del pipeline bajo control.
Cuando un test e2e del frontend falla en CI, GitHub Actions conserva el reporte HTML y los resultados de Playwright como artifacts para facilitar el diagnostico.

En este repo el backend ya tiene cobertura unitaria y e2e. En frontend hay cobertura unitaria sobre los flujos visibles principales y una suite e2e con Playwright para login, dashboard, skills y profile.

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

- endurecer manejo de errores y feedback de UX
- ampliar escenarios e2e y flujos negativos mas especificos
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
