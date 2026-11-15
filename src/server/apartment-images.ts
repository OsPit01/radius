import { getSupabaseAdmin } from '@/server/supabase';

// Бакет, куда upload.image складывает и фото квартир, и аватары пользователей.
const BUCKET = 'apartments';

/**
 * Удаляет файлы объекта из Supabase Storage по их URL.
 *
 * НЕ бросает исключение: если Storage временно недоступен, объект в БД уже
 * изменён/удалён, и ронять из-за этого весь запрос — только пугать пользователя
 * «ошибкой» при уже успешном действии. Осиротевшие файлы потом подчистит
 * скрипт scripts/cleanup-orphan-files.ts.
 */
export async function removeApartmentImages(urls: string[]): Promise<void> {
    const fileNames = urls.map((url) => url.split('/').pop()).filter((name): name is string => !!name);
    if (fileNames.length === 0) {
        return;
    }
    try {
        await getSupabaseAdmin().storage.from(BUCKET).remove(fileNames);
    } catch (error) {
        console.error(
            '[apartment] не удалось удалить фото из Storage:',
            error instanceof Error ? error.message : error,
        );
    }
}
