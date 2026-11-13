// src/lib/utils.ts
//
// После удаления мастера add-apartment здесь остались только живые хелперы:
// всё, что принадлежало мастеру (типы формы, валидация шагов, сборка данных,
// хук useForm), удалено. Форма создания объекта живёт в
// src/components/admin/add-object/form.ts, редактирование — в
// src/hooks/useApartmentForm.ts.

// Очищает поле "Улица": оставляет только текст (буквы, пробелы, тире,
// точки, скобки), убирая цифры и лишние символы, чтобы нельзя было
// случайно вписать номер дома в улицу. Нужна странице редактирования объекта.
export function sanitizeStreet(value: string): string {
    return value.replace(/[^A-Za-zА-Яа-яЁё\s.\-()]/g, '');
}

export const INPUT_CLASS =
    'w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-primary/20';

export const EDIT_INPUT_CLASS =
    'rounded-lg border border-border bg-muted px-3.5 py-2.5 text-base text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-[3px] focus:ring-primary/15 focus:outline-none';

export function toggleAmenity(current: string[], amenityId: string, checked: boolean): string[] {
    if (checked) {
        return current.includes(amenityId) ? current : [...current, amenityId];
    }
    return current.filter((item) => item !== amenityId);
}
