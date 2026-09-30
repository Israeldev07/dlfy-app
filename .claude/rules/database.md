# Base de datos — PostgreSQL

- Motor único: **PostgreSQL**. No introducir otros motores (SQLite, MySQL, Mongo) sin aprobación.
- ORM: **Prisma** (`provider = "postgresql"`), con el adapter oficial `@auth/prisma-adapter` para Auth.js.
- Conexión vía `DATABASE_URL` en variables de entorno.
- Un único `PrismaClient` en `src/lib/db.ts` (patrón singleton con `globalThis` para evitar múltiples conexiones en desarrollo con hot reload).
- Cambios de esquema **solo** mediante migraciones: `prisma migrate dev` en local, `prisma migrate deploy` en producción. Nunca `db push` contra entornos compartidos ni SQL manual sin migración.
- Convenciones de esquema:
  - IDs con `cuid()` o `uuid()`.
  - Toda tabla de negocio incluye `createdAt DateTime @default(now())` y `updatedAt DateTime @updatedAt`.
  - Modelos en PascalCase singular; mapear a tablas snake_case con `@@map` si se requiere.
  - Declarar índices (`@@index`) para columnas usadas en filtros o joins frecuentes, y `@unique` donde haya unicidad de negocio (p. ej. `User.email`).
- Usar transacciones (`prisma.$transaction`) cuando una operación modifique varias tablas.
- Seleccionar solo los campos necesarios (`select`); nunca devolver `password`/hash al cliente.
- Nunca concatenar input del usuario en `$queryRawUnsafe`; usar `$queryRaw` con template tags.
