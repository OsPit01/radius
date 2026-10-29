// ===== УТИЛИТА ТРАНСЛИТЕРАЦИИ =====
// Переводит кириллицу в латиницу для URL (слаг).
// Пример: "Минская область" → "minskaya-oblast"
// Словарь: каждая русская буква → её латинский аналог.
const TRANSLIT_MAP: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
};
export function transliterate(input: string): string {
    // Шаг 1. Нижний регистр — чтобы "М" и "м" обрабатывались одинаково.

    const lower = input.toLowerCase();
    // Шаг 2. Разбиваем строку на массив отдельных букв:
    // "минск" → ["м", "и", "н", "с", "к"].
    const chars = Array.from(lower);
    // Шаг 3. Каждую букву заменяем по словарю.
    // TRANSLIT_MAP[char] ?? char — если буквы НЕТ в словаре (цифра, дефис, латиница),
    const latin = chars.map((char) => TRANSLIT_MAP[char] ?? char);
    // Шаг 4. Собираем массив обратно в одну строку: ["m","i","n","s","k"] → "minsk".
    const joined = latin.join('');
    // Шаг 5. Пробелы → дефис (стандарт для URL-слагов).
    return joined.replaceAll(' ', '-');
}
