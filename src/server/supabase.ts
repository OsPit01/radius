import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Ленивая инициализация: клиент создаётся только в момент загрузки,
// а не при импорте модуля. Если ключ не задан — упадёт только сама
// загрузка, а не весь tRPC-сервер (как было раньше).
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase не настроен: проверь NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env",
    );
  }

  client = createClient(url, key);
  return client;
}
