// Регистрирует вебхук Telegram: после запуска бот будет слать нам каждое
// сообщение (в т.ч. /start КОД) на наш API-роут /api/telegram/webhook.
//
// Запуск (один раз, после деплоя):
//   node scripts/register-telegram-webhook.mjs
//
// ВАЖНО: URL должен быть ПУБЛИЧНЫМ (NEXT_PUBLIC_SITE_URL), а не localhost —
// Telegram не умеет ходить на локальную машину. При локальной разработке
// фронта вебхук всё равно сработает: он указывает на прод, база — общая.
import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!token) {
    console.error('TELEGRAM_BOT_TOKEN не задан в .env');
    process.exit(1);
}
if (!siteUrl) {
    console.error('NEXT_PUBLIC_SITE_URL не задан в .env');
    process.exit(1);
}

const url = `${siteUrl.replace(/\/$/, '')}/api/telegram/webhook`;

const body = {
    url,
    // secret_token: Telegram будет присылать его в заголовке x-telegram-bot-api-secret-token,
    // а наш webhook.ts сверит с TELEGRAM_WEBHOOK_SECRET — защита от поддельных вызовов.
    ...(secret ? { secret_token: secret } : {}),
    allowed_updates: ['message'],
};

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});

const data = await res.json();
console.log('Ответ Telegram setWebhook:', JSON.stringify(data));
if (data.ok) {
    console.log('✅ Вебхук зарегистрирован:', url);
} else {
    console.error('❌ Ошибка регистрации:', data.description);
    process.exit(1);
}
