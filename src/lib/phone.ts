import { parsePhoneNumber } from "libphonenumber-js";

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
  if (!value) return "";
  // Если номер не удалось распарсить — возвращаем пустую строку, а не
  // исходное значение: иначе react-phone-number-input упадёт с INVALID_COUNTRY.
  return safeParse(value)?.number ?? "";
}

export function formatPhoneForDisplay(
  value: string | null | undefined,
): string {
  if (!value) return "";
  return safeParse(value)?.formatInternational() ?? value;
}

// Проверяет, что номер валиден для своей страны (включая нужное количество цифр).
export function isValidPhoneNumber(
  value: string | null | undefined,
): boolean {
  if (!value) return false;
  return safeParse(value)?.isValid() ?? false;
}

// Достаёт "+код" страны из международного номера: "+375291234567" → "+375".
// Работает для ЛЮБОЙ страны — ничего не зашито под Беларусь или Россию.
export function getCountryCodePrefixFromNumber(
  value: string,
): string | undefined {
  const parsed = safeParse(value);
  if (!parsed) return undefined;
  return `+${parsed.countryCallingCode}`;
}
