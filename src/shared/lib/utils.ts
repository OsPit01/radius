type ClassValue = string | false | null | undefined | ClassValue[];

/**
 * Склеивает классы, пропуская пустые значения. Без tailwind-merge: конфликтующие классы НЕ разрешаются
 * (в Tailwind v4 побеждает тот, что позже в CSS, а не в строке), поэтому, чтобы переопределить класс
 * по умолчанию из shared/ui, добавляйте важность: `w-full!`.
 */
export function cn(...inputs: ClassValue[]): string {
    const classes: string[] = [];
    for (const input of inputs) {
        const value = Array.isArray(input) ? cn(...input) : input;
        if (value) {
            classes.push(value);
        }
    }
    return classes.join(' ');
}
