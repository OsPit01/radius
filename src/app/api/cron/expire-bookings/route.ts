import { NextResponse } from "next/server";
import { expireStaleBookings } from "@/server/booking-expiry";

/**
 * Cron-эндпоинт для автоматической отмены просроченных заявок.
 * Вызывается Vercel Cron (см. vercel.json). Vercel сам добавляет заголовок
 * Authorization: Bearer <CRON_SECRET>, поэтому проверяем его, чтобы
 * посторонние не могли дёргать эндпоинт.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // Если секрет задан — проверяем его. Если не задан — эндпоинт открыт
  // (небезопасно, поэтому в проде CRON_SECRET обязателен).
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const expired = await expireStaleBookings();

  return NextResponse.json({ expired });
}
