// ============================================================
// Миграция: перенос существующих telegramChatId из users в таблицу
// каналов user_channel (после перехода на абстракцию каналов).
//
// Зачем: раньше подключённый Telegram хранился в users.telegramChatId,
// теперь каналы лежат в radius_user_channel. Скрипт переносит данные,
// чтобы у тех, кто уже привязал бота, уведомления не пропали.
//
// Запуск (ОДИН раз, после db:sync):
//   npx tsx scripts/migrate-telegram-channels.ts
//
// Идемпотентность: ON CONFLICT DO NOTHING — повторный запуск не создаёт
// дубликаты (уже перенесённые строки пропускаются по unique(userId, channel)).
// ============================================================

import 'dotenv/config';

import postgres from 'postgres';

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL не задан в .env');
    }
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });

    // Переносим: для каждого юзера с telegramChatId создаём запись канала telegram.
    // DO NOTHING — если канал уже есть, не трогаем (повторный запуск безопасен).
    const rows = await sql`
        insert into radius_user_channel (user_id, channel, target, created_at)
        select id, 'telegram', telegram_chat_id, now()
        from radius_user
        where telegram_chat_id is not null
        on conflict (user_id, channel) do nothing
        returning id
    `;

    console.log(`Перенесено каналов: ${rows.length}`);
    await sql.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
