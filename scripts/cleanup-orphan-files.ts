// Скрипт очистки осиротевших файлов в Supabase Storage.
//
// Зачем: фото удаляются из бакета «apartments» вручную (см. apartment-images.ts),
// но если Storage был недоступен — файлы остаются висеть без ссылки из БД.
// Скрипт находит файлы, на которые НЕ ссылается ни одна квартира (images[])
// и ни один аватар пользователя (image), и удаляет их.
//
// Запуск:
//   npx tsx scripts/cleanup-orphan-files.ts          — dry-run (только отчёт)
//   npx tsx scripts/cleanup-orphan-files.ts --apply  — реально удаляет

import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

const BUCKET = 'apartments';
// Сколько файлов запрашиваем за один list()-вызов (лимит API — 100).
const LIST_PAGE_SIZE = 100;
// Supabase remove() за один вызов принимает ограниченное число путей — режем на пачки.
const REMOVE_CHUNK_SIZE = 1000;

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

    console.log(apply ? '▶ РЕЖИМ APPLY: осиротевшие файлы будут удалены\n' : '▶ DRY-RUN: только отчёт\n');

    // Все файлы в бакете.
    const files = await listAllFiles(supabase);
    const bucketNames = files.map((f) => f.name);

    // Все имена файлов, на которые ссылается БД.
    const referenced = new Set<string>();
    // 1. Фото квартир (images — массив строк).
    const apartmentRows = await sql<{ url: string }[]>`select unnest(images) as url from radius_apartment`;
    // 2. Аватары пользователей (image — одиночная строка).
    const userRows = await sql<{ url: string }[]>`select image as url from radius_user where image is not null`;

    for (const row of [...apartmentRows, ...userRows]) {
        const name = fileNameFromUrl(row.url);
        if (name) {
            referenced.add(name);
        }
    }

    const orphans = bucketNames.filter((name) => !referenced.has(name));

    console.log(`Файлов в бакете: ${bucketNames.length}`);
    console.log(`На них ссылается БД: ${referenced.size}`);
    console.log(`Осиротевших: ${orphans.length}\n`);
    for (const name of orphans) {
        console.log(`  ${name}`);
    }

    if (apply && orphans.length > 0) {
        for (let i = 0; i < orphans.length; i += REMOVE_CHUNK_SIZE) {
            const chunk = orphans.slice(i, i + REMOVE_CHUNK_SIZE);
            const { error } = await supabase.storage.from(BUCKET).remove(chunk);
            if (error) {
                throw new Error(`Ошибка remove(): ${error.message}`);
            }
        }
        console.log(`\nУдалено: ${orphans.length}`);
    } else if (!apply) {
        console.log('\nЭто был dry-run. Для удаления: npx tsx scripts/cleanup-orphan-files.ts --apply');
    }

    await sql.end();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
