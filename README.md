# 🚀 Skills Improvement Platform

Plataforma fullstack moderna desarrollada con **Angular + Node.js
(NestJS) + Prisma**, creada con el objetivo de mejorar y profundizar
conocimientos en tecnologías frontend y backend modernas siguiendo
buenas prácticas de arquitectura, tipado estricto y escalabilidad.

------------------------------------------------------------------------

## 🎯 Objetivo del Proyecto

Este proyecto tiene como finalidad:

-   Mejorar habilidades avanzadas en Angular (signals, standalone
    components, lazy loading, reactive forms).
-   Consolidar conocimientos backend con NestJS.
-   Implementar ORM moderno con Prisma.
-   Aplicar arquitectura limpia y escalable.
-   Utilizar Nx para estructuración monorepo.
-   Configurar un entorno profesional con:
    -   Conventional commits
    -   Husky + lint-staged
    -   EditorConfig
    -   CI/CD ready
    -   Strict typing en TypeScript

------------------------------------------------------------------------

## 🏗️ Arquitectura

Monorepo gestionado con **Nx**:

    apps/
      web/      → Frontend Angular
      api/      → Backend NestJS
    packages/
      shared/   → Tipos y utilidades compartidas

### Stack Tecnológico

### Frontend

-   Angular
-   TypeScript (strict mode)
-   RxJS
-   Signals
-   Reactive Forms

### Backend

-   Node.js
-   NestJS
-   Prisma ORM
-   PostgreSQL (configurable)

### Tooling

-   Nx
-   ESLint
-   Prettier
-   Husky
-   GitHub Actions (CI ready)

------------------------------------------------------------------------

## ⚙️ Instalación

### 1️⃣ Clonar el repositorio

``` bash
git clone <repo-url>
cd <project-name>
```

### 2️⃣ Instalar dependencias

``` bash
npm install
```

------------------------------------------------------------------------

## 🔐 Variables de Entorno

Crear un archivo `.env` basado en `.env.example`:

    DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/db?schema=public"
    JWT_SECRET="your_secret"

------------------------------------------------------------------------

## ▶️ Ejecutar el Proyecto

### Frontend

``` bash
npx nx serve web
```

### Backend

``` bash
npx nx serve api
```

------------------------------------------------------------------------

## 🧪 Testing

``` bash
npx nx test web
npx nx test api
```

------------------------------------------------------------------------

## 🏷️ Convención de Commits

Se utiliza **Conventional Commits**:

-   `feat:` nueva funcionalidad
-   `fix:` corrección de bug
-   `refactor:` mejora interna sin cambiar comportamiento
-   `chore:` configuración / tooling
-   `docs:` documentación
-   `test:` tests

Ejemplo:

    feat(api): create users endpoint

------------------------------------------------------------------------

## 📈 Buenas Prácticas Implementadas

-   Strict TypeScript (sin `any`)
-   Arquitectura modular
-   Servicios con responsabilidad única
-   Lazy loading en rutas
-   Estado manejado con signals
-   Validación de DTOs en backend
-   Separación clara frontend/backend
-   Variables de entorno protegidas

------------------------------------------------------------------------

## 🚧 Roadmap

-   [ ] Autenticación JWT
-   [ ] Sistema de roles
-   [ ] Gestión de perfiles
-   [ ] Módulo de Skills dinámico
-   [ ] Tests unitarios y e2e completos
-   [ ] CI automatizado completo
-   [ ] Dockerización

------------------------------------------------------------------------

## 📚 Motivación

Este proyecto no es solo una aplicación funcional, sino un entorno de
experimentación profesional para:

-   Probar nuevas features del ecosistema Angular.
-   Aplicar patrones de arquitectura backend modernos.
-   Simular un entorno real de desarrollo profesional.

------------------------------------------------------------------------

## 👨‍💻 Autor

Proyecto desarrollado como laboratorio personal de mejora continua en
desarrollo fullstack.

------------------------------------------------------------------------

## 📄 Licencia

Uso personal / educativo.
