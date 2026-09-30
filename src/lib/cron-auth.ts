import { timingSafeEqual } from "node:crypto";

/** Los crons llaman con `Authorization: Bearer <CRON_SECRET>` (formato de Vercel Cron y QStash). */
export function isAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
