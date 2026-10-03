/**
 * Políticas de rate limiting (ventana fija). Puro para poder testearlo;
 * el contador vive en Postgres (`rate-limit.ts`).
 * `blockSec`: al superar el límite, el bloqueo dura al menos esto desde ese momento
 * (sin él, quien se pasa al final de la ventana esperaría solo lo que le queda).
 */
export const RATE_LIMITS = {
  /** Intentos de login por IP: frena barridos de muchas cuentas desde un origen. */
  "login:ip": { limit: 30, windowSec: 15 * 60, blockSec: 15 * 60 },
  /** Intentos de login por email: frena fuerza bruta contra una cuenta. */
  "login:email": { limit: 8, windowSec: 15 * 60, blockSec: 15 * 60 },
  "register:ip": { limit: 5, windowSec: 60 * 60 },
  /** Cada pedido genera mensajes de WhatsApp al dueño y al comercio. */
  "order:user": { limit: 5, windowSec: 10 * 60 },
} as const satisfies Record<string, { limit: number; windowSec: number; blockSec?: number }>;

export type RateLimitPolicy = keyof typeof RATE_LIMITS;

/** Código del `CredentialsSignin` que lanza `authorize` al superar el límite (viaja en la URL). */
export const RATE_LIMITED_CODE = "rate_limited";

/**
 * IP del cliente. `x-real-ip` lo fija la plataforma (Vercel) y no lo controla el cliente;
 * `x-forwarded-for` queda como respaldo para otros proxies.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}

export function retryAfterLabel(seconds: number): string {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
}
