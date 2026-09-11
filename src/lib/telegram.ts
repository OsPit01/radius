import { z } from "zod";
import { env } from "@/env";

const telegramApiBase = "https://api.telegram.org/bot";

const telegramResponseSchema = z.object({
  ok: z.boolean(),
  description: z.string().optional(),
});

const telegramUpdatesSchema = z.object({
  ok: z.boolean(),
  result: z
    .array(
      z.object({
        message: z
          .object({
            chat: z.object({
              id: z.number(),
            }),
            text: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

export type TelegramUpdate = {
  chatId: number;
  text: string;
};

/**
 * Забирает последние сообщения, отправленные боту (метод getUpdates).
 * Важно: после вызова эти сообщения удаляются из очереди Telegram —
 * вызывайте только когда уверены, что сообщение уже пришло.
 */
export async function getTelegramUpdates(): Promise<TelegramUpdate[]> {
  const url = new URL(`${telegramApiBase}${env.TELEGRAM_BOT_TOKEN}/getUpdates`);

  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    return [];
  }

  const data = telegramUpdatesSchema.safeParse(await response.json());
  if (!data.success) return [];

  return (data.data.result ?? [])
    .filter((update) => update.message?.chat.id !== undefined)
    .map((update) => ({
      chatId: update.message!.chat.id,
      text: update.message!.text ?? "",
    }));
}

/**
 * Отправляет сообщение в Telegram от имени бота.
 * @param chatId - идентификатор чата (например, личный диалог с ботом)
 * @param text - текст сообщения (HTML разметка разрешена)
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<{ ok: boolean; description?: string }> {
  const url = new URL(`${telegramApiBase}${env.TELEGRAM_BOT_TOKEN}/sendMessage`);

  url.searchParams.set("chat_id", chatId);
  url.searchParams.set("text", text);
  url.searchParams.set("parse_mode", "HTML");

  const response = await fetch(url, { method: "POST" });

  if (!response.ok) {
    return { ok: false, description: `HTTP ${response.status}` };
  }

  const data = telegramResponseSchema.safeParse(await response.json());

  return {
    ok: data.data?.ok ?? false,
    description: data.data?.description,
  };
}