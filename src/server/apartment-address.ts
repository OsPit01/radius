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

export function isAddressChanged(existing: ApartmentRow, input: UpdateApartmentInput): boolean {
    return ADDRESS_FIELDS.some((field) => {
        const next = input[field];
        return next !== undefined && (existing[field] ?? null) !== (next ?? null);
    });
}
