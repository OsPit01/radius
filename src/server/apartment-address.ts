import type { UpdateApartmentInput } from '@/lib/schemas/apartment';
import type { apartments } from '@/server/db/schemas';

type ApartmentRow = typeof apartments.$inferSelect;

const ADDRESS_FIELDS = [
    'region',
    'city',
    'street',
    'numberHome',
    'building',
    'district',
    'microdistrict',
    'lat',
    'lon',
    'metroStation',
    'minsToMetro',
] as const;

/** null, undefined и '' — одно и то же «поле не заполнено». */
function isBlank(value: unknown): boolean {
    return value === null || value === undefined || value === '';
}

export function isAddressChanged(existing: ApartmentRow, input: UpdateApartmentInput): boolean {
    return ADDRESS_FIELDS.some((field) => {
        const next = input[field];
        // Поле не пришло в запросе — это не изменение.
        if (next === undefined) {
            return false;
        }
        const prev = existing[field];
        // Оба «пустые» (NULL, undefined или '') — считаем, что не менялось.
        if (isBlank(prev) && isBlank(next)) {
            return false;
        }
        return prev !== next;
    });
}
