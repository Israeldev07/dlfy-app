/**
 * Devuelve siempre una ruta interna ("/algo?x=y") o undefined: evita redirecciones abiertas.
 * Acepta URLs absolutas (el proxy de Auth.js las envía así) pero descarta su dominio.
 */
export function safeCallbackUrl(value: string | undefined | null): string | undefined {
  if (!value) return undefined;

  let target: string;
  try {
    const url = new URL(value, "http://interno.local");
    target = `${url.pathname}${url.search}`;
  } catch {
    return undefined;
  }

  if (!target.startsWith("/") || target.startsWith("//")) return undefined;
  if (target.startsWith("/login") || target.startsWith("/registro")) return undefined;
  return target;
}
