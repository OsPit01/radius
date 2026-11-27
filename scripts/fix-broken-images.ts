// Скрипт поиска и чистки битых ссылок на фото.
//
// Зачем: в БД (radius_apartment.images) могут лежать ссылки на файлы,
// которых УЖЕ НЕТ в Supabase Storage (файл удалили вручную, бакет чистили
// и т.п.). Карточка объекта при этом показывает битое фото.
// Скрипт находит такие ссылки и убирает их из массива images.
//
// Запуск:
//   npx tsx scripts/fix-broken-images.ts          — dry-run (только отчёт)
//   npx tsx scripts/fix-broken-images.ts --apply  — реально убирает битые ссылки из БД

import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

const BUCKET = 'apartments';
// Сколько файлов запрашиваем за один list()-вызов (лимит API — 100).
const LIST_PAGE_SIZE = 100;

function getSupabase() {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error('Задай SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env');
    }
    return createClient(url, key);
}

// Листинг всех файлов bucket с пагинацией (Supabase отдаёт максимум 100 за раз).
async function listAllFiles(supabase: ReturnType<typeof getSupabase>) {
    const files: { name: string }[] = [];
    for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
        const { data, error } = await supabase.storage.from(BUCKET).list('', { limit: LIST_PAGE_SIZE, offset });
        if (error) {
            throw new Error(`Ошибка list(): ${error.message}`);
        }
        if (!data || data.length === 0) {
            break;
        }
        // list() возвращает и папки, и файлы — у папок нет размера в metadata.
        files.push(...data.filter((f) => f.metadata?.size !== undefined));
        if (data.length < LIST_PAGE_SIZE) {
            break;
        }
    }
    return files;
}

// Имя файла из URL («https://…/apartments/abc.webp» → «abc.webp»).
function fileNameFromUrl(url: string): string | null {
    return url.split('/').pop() ?? null;
}

async function main() {
    const apply = process.argv.includes('--apply');
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL не задан в .env');
    }

    const supabase = getSupabase();
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });

    console.log(apply ? '▶ РЕЖИМ APPLY: битые ссылки будут убраны из БД\n' : '▶ DRY-RUN: только отчёт\n');

    // Все имена файлов, реально лежащих в бакете.
    const files = await listAllFiles(supabase);
    const bucketNames = new Set(files.map((f) => f.name));

    // Все ссылки на фото из БД: id объекта + url.
    const rows = await sql<{ id: number; url: string }[]>`
        select id, unnest(images) as url from radius_apartment
    `;

    // Битая ссылка = файла с таким именем в бакете нет.
    const broken = rows.filter((r) => {
        const name = fileNameFromUrl(r.url);
        return name !== null && !bucketNames.has(name);
    });

    console.log(`Ссылок на фото в БД: ${rows.length}`);
    console.log(`Файлов в бакете: ${bucketNames.size}`);
    console.log(`Битых ссылок: ${broken.length}\n`);
    for (const b of broken) {
        console.log(`  объект #${b.id}: ${b.url}`);
    }

    if (apply && broken.length > 0) {
        // Убираем каждую битую ссылку из массива images её объекта.
        for (const b of broken) {
            await sql`update radius_apartment set images = array_remove(images, ${b.url}) where id = ${b.id}`;
        }
        console.log(`\nУбрано битых ссылок: ${broken.length}`);
    } else if (!apply) {
        console.log('\nЭто был dry-run. Для применения: npx tsx scripts/fix-broken-images.ts --apply');
    }

    await sql.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
