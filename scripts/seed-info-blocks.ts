// Скрипт наполнения таблицы radius_info_block стартовыми блоками.
//
// Зачем: после db:sync таблица пустая, а вкладка «Информация» должна
// что-то показывать с первого деплоя. Скрипт вставляет 5 базовых блоков.
//
// Идемпотентность: ON CONFLICT (id) DO UPDATE — повторный запуск не плодит
// дубликаты, а обновляет существующие блоки. Запускать можно сколько угодно раз.
//
// Запуск:
//   npx tsx scripts/seed-info-blocks.ts

import 'dotenv/config';

import postgres from 'postgres';

import { OPERATOR } from '../src/lib/legal/operator';

type InfoItem = { text: string; href: string | null };

const BLOCKS: { id: string; icon: string; title: string; sortOrder: number; items: InfoItem[] }[] = [
    {
        id: 'beginner-guide',
        icon: 'home',
        title: 'Путеводитель для начинающих',
        sortOrder: 1,
        items: [
            {
                text: 'Добавьте первую квартиру: адрес, описание, фото и цена — объявление пройдёт модерацию и появится в каталоге.',
                href: null,
            },
            {
                text: 'Укажите время заезда и выезда, вместимость и удобства — гости увидят это в карточке объекта.',
                href: null,
            },
            {
                text: 'Убедитесь, что в настройках указан актуальный телефон — по нему гость свяжется с вами.',
                href: null,
            },
            { text: 'Отвечайте на заявки во вкладке «Мои заявки» — так вы не потеряете ни одного гостя.', href: null },
        ],
    },
    {
        id: 'how-it-works',
        icon: 'route',
        title: 'Как это работает',
        sortOrder: 2,
        items: [
            {
                text: 'Гость открывает вашу квартиру и отправляет заявку — указывает даты заезда и выезда, число гостей и телефон.',
                href: null,
            },
            { text: 'Заявка появляется во вкладке «Мои заявки» со статусом «Для подтверждения».', href: null },
            {
                text: 'Вы подтверждаете заявку — бронь согласована, либо отклоняете её с указанием причины.',
                href: null,
            },
            { text: 'После подтверждения открывается чат с гостем — там можно уточнить детали заезда.', href: null },
        ],
    },
    {
        id: 'statuses',
        icon: 'info',
        title: 'Статусы заявок',
        sortOrder: 3,
        items: [
            { text: 'Для подтверждения — новая заявка, ждёт вашего ответа.', href: null },
            { text: 'Подтверждена — вы приняли бронь, гость приедет.', href: null },
            { text: 'Отклонена — вы отказали, заявка закрыта.', href: null },
            { text: 'Отменена — бронь отменили вы или гость.', href: null },
            { text: 'Истекла — вы не ответили вовремя, заявка закрылась автоматически.', href: null },
        ],
    },
    {
        id: 'tips',
        icon: 'note',
        title: 'Советы',
        sortOrder: 4,
        items: [
            { text: 'Отвечайте на заявки быстро — просроченные заявки истекают автоматически.', href: null },
            { text: 'Подключите Telegram в настройках, чтобы не пропускать новые заявки.', href: null },
            { text: 'Общайтесь с гостем в чате, чтобы уточнить детали заезда.', href: null },
            { text: 'Проверяйте даты заезда и выезда в заявке, прежде чем подтверждать.', href: null },
        ],
    },
    {
        id: 'help',
        icon: 'mail',
        title: 'Помощь',
        sortOrder: 5,
        items: [
            { text: 'Напишите в поддержку', href: `mailto:${OPERATOR.supportEmail}` },
            { text: 'Telegram поддержки', href: OPERATOR.supportTelegramUrl },
            { text: 'Ответы на частые вопросы', href: '/faq' },
        ],
    },
];

async function main() {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL не задан в .env');
    }
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });

    console.log('▶ Наполняем radius_info_block стартовыми блоками...\n');

    for (const block of BLOCKS) {
        await sql`
            insert into radius_info_block (id, icon, title, items, "sortOrder")
            values (${block.id}, ${block.icon}, ${block.title}, ${sql.json(block.items)}, ${block.sortOrder})
            on conflict (id) do update set
                icon = excluded.icon,
                title = excluded.title,
                items = excluded.items,
                "sortOrder" = excluded."sortOrder"
        `;
        console.log(`  ✓ ${block.title}`);
    }

    console.log(`\nГотово. Вставлено/обновлено блоков: ${BLOCKS.length}`);
    await sql.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
