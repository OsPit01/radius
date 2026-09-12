import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "@/env";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { sendTelegramMessage } from "@/lib/telegram";

const telegramUpdateSchema = z.object({
  message: z
    .object({
      chat: z.object({
        id: z.number(),
      }),
      text: z.string().optional(),
    })
    .optional(),
});

/**
 * Webhook для Telegram: Telegram сам присылает сюда каждое сообщение боту,
 * когда пользователь отправляет ему код привязки.
 * Регистрируется вызовом метода setWebhook (см. scripts/register-telegram-webhook.mjs).
 */
export async function POST(req: NextRequest) {
  // Проверяем секретную подпись, если секрет задан в окружении
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (env.TELEGRAM_WEBHOOK_SECRET && secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }
  const parsed = telegramUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false });
  }

  const message = parsed.data.message;
  const chatId = message?.chat.id;
  const text = message?.text?.trim();

  // Пришло не текстовое сообщение (фото, стикер и т.п.) — игнорируем
  if (chatId === undefined || !text) {
    return NextResponse.json({ ok: true });
  }

  // Ищем пользователя, которому был выдан такой код привязки
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.telegramLinkCode, text))
    .limit(1);

  if (!user) {
    // Код не совпал — просто отвечаем Telegram, что приняли сообщение
    return NextResponse.json({ ok: true });
  }

  // Код верный — привязываем чат и очищаем код
  await db
    .update(users)
    .set({ telegramChatId: String(chatId), telegramLinkCode: null })
    .where(eq(users.id, user.id));

  await sendTelegramMessage(
    String(chatId),
    "Поздравляем! Вы подключили уведомления. Теперь на этот чат будут приходить заявки на бронирование.",
  );

  return NextResponse.json({ ok: true });
}
