import sharp from 'sharp';

// ===== КОНСТАНТЫ ОПТИМИЗАЦИИ (каноничные настройки для веб-фотографий) =====

// Максимальная ширина после ресайза. 1920px достаточно для:
// - Full HD мониторов (1920×1080)
// - Retina-дисплеев (960pt × 2 = 1920px)
// - Мобильных экранов (Next.js сам уменьшит через srcset)
// Фото шире 1920px не показывают на экранах — нет смысла хранить лишние пиксели.
const MAX_WIDTH = 1920;

// Качество WebP: 80 — оптимальный баланс (бессмысленно выше 85).
// На глаз разница с 100 незаметна, а вес — в 3-5 раз меньше.
const WEBP_QUALITY = 80;

// ===== РЕЗУЛЬТАТ ОПТИМИЗАЦИИ =====
export interface OptimizedImage {
    buffer: Buffer;
    width: number;
    height: number;
    sizeBytes: number;
}

/**
 * Оптимизирует изображение: ресайз до MAX_WIDTH + конвертация в WebP.
 *
 * Под капотом:
 * 1. sharp(buffer) — читает оригинальный файл (jpeg/png/webp/etc)
 * 2. .resize() — уменьшает ширину до MAX_WIDTH (высота пропорционально)
 *    - withoutEnlargement: true — НЕ растягивает мелкие фото
 * 3. .webp() — конвертирует в формат WebP с quality WEBP_QUALITY
 * 4. .toBuffer() — собирает итоговый буфер в памяти
 *
 * Почему WebP:
 * - В 2-3 раза меньше JPEG при том же качестве
 * - Поддержка 98%+ браузеров (2024+)
 * - Быстрее декодируется на мобильных
 *
 * @param buffer - оригинальный буфер изображения (любой формат: jpeg, png, webp, heic)
 * @returns OptimizedImage с новым буфером и метаданными
 * @throws Error если формат не поддерживается sharp (битый файл, svg и т.д.)
 */
export async function optimizeImage(buffer: Buffer): Promise<OptimizedImage> {
    const image = sharp(buffer, { failOn: 'none' });

    const { width, height } = await image.metadata();
    if (!width || !height) {
        throw new Error('Не удалось определить размеры изображения');
    }

    const optimizedBuffer = await image
        .resize({
            width: MAX_WIDTH,
            withoutEnlargement: true, // не растягиваем мелкие фото
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

    const { width: newWidth, height: newHeight } = await sharp(optimizedBuffer).metadata();

    return {
        buffer: optimizedBuffer,
        width: newWidth ?? width,
        height: newHeight ?? height,
        sizeBytes: optimizedBuffer.length,
    };
}

/**
 * Форматирует размер в человекочитаемый вид.
 * Пример: 153600 → "150 KB"
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
