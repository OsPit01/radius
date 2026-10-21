// Скрипт пережатия фото: пережимает все фото из Supabase Storage в WebP.
//
// Зачем: до установки оптимизации фото загружались оригиналами (до 5 МБ).
// Скрипт скачивает каждый файл, ресайзит до 1920px, конвертирует в WebP
// (quality 80), заливает обратно и обновляет ссылки в БД.
//
// Запуск:
//   npx tsx scripts/recompress-images.ts          — dry-run (только отчёт, ничего не меняет)
//   npx tsx scripts/recompress-images.ts --apply  — реально пережимает и обновляет БД
//
// Dry-run по умолчанию — safety-канон: сначала смотришь отчёт, потом решаешь.

import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

import { formatBytes, optimizeImage } from '../src/server/image-optimizer';

const BUCKET = 'apartments';
// Сколько файлов запрашиваем у Supabase за один list()-вызов (лимит API — 100).
const LIST_PAGE_SIZE = 100;

// Файлы, которые уже в WebP, пережимать НЕЛЬКОМ: повторное
// сжатие webp→webp деградирует качество без выгоды в весе.
function isAlreadyWebp(name: string): boolean {
    return name.toLowerCase().endsWith('.webp');
}

// Форматы, которые умеет читать sharp. Всё остальное (.txt и прочий мусор,
// случайно попавший в бакет) в обработку не идёт: sharp упал бы с ошибкой
// "unsupported image format", и файл считался бы ошибкой.
const IMAGE_EXTENSION = /\.(jpe?g|png|webp|avif|gif|tiff?)$/i;

function isImageFile(name: string): boolean {
    return IMAGE_EXTENSION.test(name);
}

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
        // list() возвращает и папки, и файлы — у папок нет размера в metadata
        files.push(...data.filter((f) => f.metadata?.size !== undefined));
        if (data.length < LIST_PAGE_SIZE) {
            break;
        }
    }
    return files;
}

// Обновляет ссылки в БД: заменяет имя старого файла на имя нового
// (подстрочная замена — работает при любом домене хранилища).
async function updateDbUrls(sql: postgres.Sql, oldName: string, newName: string) {
    // 1. Обложка квартиры (radius_apartment.image — одна строка)
    await sql`
    UPDATE radius_apartment
    SET image = replace(image, ${oldName}, ${newName})
    WHERE image LIKE ${'%' + oldName}`;

    // 2. Галерея квартир (radius_apartment.images — массив строк).
    // unnest() разворачивает массив в таблицу строк, replace() меняет имя
    // в каждой, array_agg() собирает обратно в массив.
    await sql`
    UPDATE radius_apartment
    SET images = (
      SELECT array_agg(replace(i, ${oldName}, ${newName}))
      FROM unnest(images) AS i
    )
    WHERE EXISTS (
      SELECT 1 FROM unnest(images) AS i WHERE i LIKE ${'%' + oldName}
    )`;

    // 3. Аватар пользователя (radius_user.image — может быть null)
    await sql`
    UPDATE radius_user
    SET image = replace(image, ${oldName}, ${newName})
    WHERE image LIKE ${'%' + oldName}`;
}

async function main() {
    const apply = process.argv.includes('--apply');
    const baseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) {
        throw new Error('SUPABASE_URL не задан в .env');
    }
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL не задан в .env');
    }

    const supabase = getSupabase();
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });

    console.log(apply ? '▶ РЕЖИМ APPLY: файлы будут пережаты\n' : '▶ DRY-RUN: только отчёт, ничего не меняется\n');

    const files = await listAllFiles(supabase);
    const images = files.filter((f) => isImageFile(f.name));
    const nonImages = files.length - images.length;
    const toProcess = images.filter((f) => !isAlreadyWebp(f.name));
    const skipped = images.length - toProcess.length;
    console.log(
        `Найдено файлов: ${files.length} (уже WebP — ${skipped}, не-изображения — ${nonImages}, к пережатию — ${toProcess.length})\n`,
    );

    let totalBefore = 0;
    let totalAfter = 0;
    let okCount = 0;
    let failCount = 0;

    for (const [index, file] of toProcess.entries()) {
        const n = `[${index + 1}/${toProcess.length}]`;
        try {
            // 1. Скачиваем оригинал из Supabase Storage
            const { data: blob, error: dlError } = await supabase.storage.from(BUCKET).download(file.name);
            if (dlError || !blob) {
                throw new Error(dlError?.message ?? 'пустой ответ');
            }
            const original = Buffer.from(await blob.arrayBuffer());

            // 2. Оптимизируем: resize 1920px + WebP quality 80
            const optimized = await optimizeImage(original);
            totalBefore += original.length;
            totalAfter += optimized.buffer.length;

            // 3. Новое имя: то же базовое имя, но .webp
            const newName = file.name.replace(/\.[^.]+$/, '') + '.webp';

            const saved = 100 - (optimized.sizeBytes / original.length) * 100;
            console.log(
                `${n} ${file.name} → ${newName}  ${formatBytes(original.length)} → ${formatBytes(optimized.sizeBytes)}  (−${saved.toFixed(0)}%)`,
            );

            // Реальные изменения — только в --apply. Любой сбой здесь (upload, БД)
            // бросает исключение → catch → failCount++, до okCount++ не доходит.
            if (apply) {
                // 4. Заливаем WebP (upsert: если скрипт запускали дважды — перезапишет)
                const { error: upError } = await supabase.storage.from(BUCKET).upload(newName, optimized.buffer, {
                    contentType: 'image/webp',
                    cacheControl: '3600',
                    upsert: true,
                });
                if (upError) {
                    throw new Error(`upload: ${upError.message}`);
                }

                // 5. Обновляем ссылки в БД (обложка, галерея, аватары)
                await updateDbUrls(sql, file.name, newName);

                // 6. Удаляем старый тяжёлый файл (только после успешного обновления БД)
                const { error: rmError } = await supabase.storage.from(BUCKET).remove([file.name]);
                if (rmError) {
                    // Не фатально: файл никем не используется, но предупредим
                    console.warn(`   ⚠ не удалось удалить старый файл: ${rmError.message}`);
                }
            }

            // Успех: в dry-run файл просто просчитан, в apply — пережат и залит
            okCount++;
        } catch (err) {
            failCount++;
            console.error(`${n} ✖ ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    await sql.end();

    console.log('\n===== ИТОГ =====');
    console.log(
        `Обработано: ${okCount}, ошибок: ${failCount}, пропущено (уже WebP): ${skipped}, не-изображения: ${nonImages}`,
    );
    if (totalBefore > 0) {
        console.log(
            `Вес: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (−${(100 - (totalAfter / totalBefore) * 100).toFixed(0)}%)`,
        );
    }
    if (!apply) {
        console.log('\nЭто был dry-run. Для применения: npx tsx scripts/recompress-images.ts --apply');
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
