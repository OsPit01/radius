import { getExampleNumber, isSupportedCountry, parsePhoneNumber } from 'libphonenumber-js';
// Примеры номеров по странам (4 КБ) — чтобы показать пользователю формат под его флагом.
import examples from 'libphonenumber-js/examples.mobile.json';

// Безопасный парсинг: parsePhoneNumber для кривых номеров НЕ возвращает
// undefined, а БРОСАЕТ исключение (ParseError: INVALID_COUNTRY и т.п.).
// Поэтому оборачиваем в try/catch, чтобы не ронять страницу.
function safeParse(value: string) {
    try {
        return parsePhoneNumber(value);
    } catch {
        return undefined;
    }
}

export function toE164(value: string | null | undefined): string {
    if (!value) {
        return '';
    }
    // Если номер не удалось распарсить — возвращаем пустую строку, а не
    // исходное значение: иначе react-phone-number-input упадёт с INVALID_COUNTRY.
    return safeParse(value)?.number ?? '';
}

export function formatPhoneForDisplay(value: string | null | undefined): string {
    if (!value) {
        return '';
    }
    return safeParse(value)?.formatInternational() ?? value;
}

// Проверяет, что номер валиден для своей страны (включая нужное количество цифр).
export function isValidPhoneNumber(value: string | null | undefined): boolean {
    if (!value) {
        return false;
    }
    return safeParse(value)?.isValid() ?? false;
}

// Достаёт "+код" страны из международного номера: "+375291234567" → "+375".
// Работает для ЛЮБОЙ страны — ничего не зашито под Беларусь или Россию.
export function getCountryCodePrefixFromNumber(value: string): string | undefined {
    const parsed = safeParse(value);
    if (!parsed) {
        return undefined;
    }
    return `+${parsed.countryCallingCode}`;
}

// Пример номера для страны (в международном формате): 'BY' → '+375 29 123-45-67'.
// Используется как placeholder и подсказка под полем телефона, чтобы человек
// сразу видел формат под выбранным флагом. Неизвестная страна → undefined.
export function getExamplePhoneNumber(country: string): string | undefined {
    // isSupportedCountry — type guard: после него country считается CountryCode.
    if (!isSupportedCountry(country)) {
        return undefined;
    }
    return getExampleNumber(country, examples)?.formatInternational();
}

// Максимальная длина национальной части номера для страны — по её мобильному примеру.
// Для BY пример «+375 29 123-45-67» → национальная часть «291234567» = 9 цифр.
// Зачем: limitMaxLength у react-phone-number-input режет только по «possible» длинам,
// а у Беларуси они 6–11 (городские/служебные номера). Для площадки аренды нужен
// мобильный формат, поэтому лимит берём из примера мобильного номера страны.
export function getNationalNumberMaxLength(country: string): number {
    const example = getExamplePhoneNumber(country);
    if (!example) {
        return 15; // неизвестная страна — лимит по максимуму E.164 (15 значащих цифр)
    }
    return safeParse(example)?.nationalNumber.length ?? 15;
}

// Обрезает международный номер, если его национальная часть длиннее допустимой
// для этой страны. Не удалось распознать номер — возвращаем как есть (не трогаем).
export function limitNationalNumberLength(value: string): string {
    const parsed = safeParse(value);
    if (!parsed) {
        return value;
    }
    const maxLength = getNationalNumberMaxLength(parsed.country ?? '');
    if (parsed.nationalNumber.length <= maxLength) {
        return value;
    }
    return `+${parsed.countryCallingCode}${parsed.nationalNumber.slice(0, maxLength)}`;
}
