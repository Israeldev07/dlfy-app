import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { RATE_LIMITS, type RateLimitPolicy } from "./rate-limit-rules";

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

/**
 * Suma un intento a la ventana de `policy` para `identifier` y dice si sigue permitido.
 * Un solo upsert atómico: es seguro con peticiones concurrentes y varias instancias.
 * El identificador se guarda hasheado (puede ser un email o una IP).
 */
export async function consumeRateLimit(policy: RateLimitPolicy, identifier: string): Promise<RateLimitResult> {
  const rule: { limit: number; windowSec: number; blockSec?: number } = RATE_LIMITS[policy];
  const { limit, windowSec, blockSec = 0 } = rule;

  // Las columnas son `timestamp` sin zona y Prisma guarda en UTC: comparar siempre en UTC.
  // Al cruzar el límite (count pasa a limit + 1), el bloqueo se alarga hasta `blockSec` desde ahora.
  const [row] = await prisma.$queryRaw<{ count: number; retryAfterSec: number }[]>`
    INSERT INTO "rate_limit_buckets" ("key", "count", "resetAt", "updatedAt")
    VALUES (
      ${bucketKey(policy, identifier)}, 1,
      (now() AT TIME ZONE 'UTC') + ${windowSec}::int * interval '1 second',
      now() AT TIME ZONE 'UTC'
    )
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "rate_limit_buckets"."resetAt" <= (now() AT TIME ZONE 'UTC')
        THEN 1 ELSE "rate_limit_buckets"."count" + 1 END,
      "resetAt" = CASE
        WHEN "rate_limit_buckets"."resetAt" <= (now() AT TIME ZONE 'UTC') THEN EXCLUDED."resetAt"
        WHEN "rate_limit_buckets"."count" + 1 = ${limit}::int + 1 THEN GREATEST(
          "rate_limit_buckets"."resetAt",
          (now() AT TIME ZONE 'UTC') + ${blockSec}::int * interval '1 second'
        )
        ELSE "rate_limit_buckets"."resetAt" END,
      "updatedAt" = now() AT TIME ZONE 'UTC'
    RETURNING "count", ${RETRY_AFTER_SQL} AS "retryAfterSec"
  `;

  return row.count <= limit ? { ok: true } : { ok: false, retryAfterSec: row.retryAfterSec };
}

/** Consulta sin sumar un intento: cuánto falta para que `identifier` pueda volver a intentar. */
export async function peekRateLimit(policy: RateLimitPolicy, identifier: string): Promise<RateLimitResult> {
  const { limit } = RATE_LIMITS[policy];
  const [row] = await prisma.$queryRaw<{ count: number; retryAfterSec: number }[]>`
    SELECT "count", ${RETRY_AFTER_SQL} AS "retryAfterSec"
    FROM "rate_limit_buckets"
    WHERE "key" = ${bucketKey(policy, identifier)} AND "resetAt" > (now() AT TIME ZONE 'UTC')
  `;
  return !row || row.count <= limit ? { ok: true } : { ok: false, retryAfterSec: row.retryAfterSec };
}

const RETRY_AFTER_SQL = Prisma.sql`GREATEST(1, ROUND(EXTRACT(EPOCH FROM ("resetAt" - (now() AT TIME ZONE 'UTC')))))::int`;

function bucketKey(policy: RateLimitPolicy, identifier: string) {
  return `${policy}:${createHash("sha256").update(identifier).digest("hex")}`;
}

/** Borra ventanas vencidas; lo llama el cron de expiración. */
export async function pruneRateLimits() {
  const { count } = await prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: new Date() } } });
  return count;
}
