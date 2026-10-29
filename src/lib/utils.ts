import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

import { findNearestMetro, isMetroRegion, walkMinutesToStation } from '@/lib/metro';
import { isMetroWalkable } from '@/lib/metro-limit';
import type { CreateApartmentInput } from '@/lib/schemas/apartment';

export type FormData = {
    type: string;
    /** Только область — одна из шести (`value` из BELARUS_REGIONS, Минск относится к Минской). Пусто, пока не определена. */
    region: string;
    /**
     * Район области («Минский район») или, у Минска и областных центров, район города («Центральный»).
     * Определяется по адресу, руками не меняется и необязателен: может быть пустым.
     */
    district: string;
    city: string;
    street: string;
    numberHome: string;
    /** 0 — координаты ещё не определены (в Беларуси широта и долгота всегда положительные). */
    lat: number;
    lon: number;
    title: string;
    capacity: number;
    price: number;
    currency: string;
    rooms: number;
    beds: number;
    singleBeds: number;
    doubleSofas: number;
    singleSofas: number;
    image: string;
    description: string;
    rules: string;
    minsToMetro: number;
    metroStation: string;
    area: number;
    floor: number;
    bathrooms: number;
    amenities: string[];
    parking: string;
    images: string[];
    checkInTime: string;
    checkOutTime: string;
    payerType: string;
    unp: string;
    payerName: string;
};

export type FieldPath = keyof FormData;

export type StepFieldValue = string | number | string[] | boolean;

/** Поля, которые меняются вместе при выборе или правке адреса (см. patchAddress). */
export type AddressPatch = Partial<
    Pick<FormData, 'region' | 'district' | 'city' | 'street' | 'numberHome' | 'lat' | 'lon'>
>;

export type StepProps = {
    formData: FormData;
    updateField: (field: keyof FormData, value: StepFieldValue) => void;
    updateAddress: (patch: AddressPatch) => void;
    setFormData: Dispatch<SetStateAction<FormData>>;
    error?: string | null;
    errors: FieldPath[];
};

export type Apartment = {
    id: number;
    title: string;
    city: string;
    district: string;
    capacity: number;
    price: number;
    image: string;
    description: string;
    rooms: number;
    minsToMetro: number;
    currency: string;
};

// ============================================================
// 2. АДРЕС
// ============================================================

// Очищает поле "Улица": оставляет только текст (буквы, пробелы, тире,
// точки, скобки), убирая цифры и лишние символы, чтобы нельзя было
// случайно вписать номер дома в улицу. Нужна странице редактирования объекта.
export function sanitizeStreet(value: string): string {
    return value.replace(/[^A-Za-zА-Яа-яЁё\s.\-()]/g, '');
}

// Названия из справочника улиц (OSM) и от геокодера могут отличаться регистром, «ё» и порядком типа
// («улица Немига» / «Немига улица»), поэтому сравниваем без типа улицы.
const STREET_TYPE_WORDS = new Set([
    'улица',
    'ул',
    'переулок',
    'пер',
    'проспект',
    'пр-т',
    'пр',
    'бульвар',
    'б-р',
    'площадь',
    'пл',
    'проезд',
    'тупик',
    'тракт',
    'шоссе',
    'набережная',
    'наб',
    'аллея',
    'спуск',
]);

export function normalizeGeoName(value: string): string {
    return value.toLowerCase().replaceAll('ё', 'е').trim();
}

export function isSameStreet(a: string, b: string): boolean {
    const key = (value: string) =>
        normalizeGeoName(value)
            .replace(/[.,]/g, ' ')
            .split(/\s+/)
            .filter((word) => word !== '' && !STREET_TYPE_WORDS.has(word))
            .join(' ');
    return key(a) !== '' && key(a) === key(b);
}

/**
 * Меняет поля адреса — единственное место, где живут правила «адрес поменялся»:
 *  - поменялся город, улица или дом, а координаты не переданы — координаты относились к прежнему адресу, сбрасываем;
 *    станцию метро (подставленную нами или выбранную вручную) и минуты пешком при ней тоже: они считались от прежнего
 *    адреса, а новую станцию подберут новые координаты. Время, введённое вручную без станции, оставляем, пока адрес в
 *    области с метро (там поле видно); в другой области метро нет совсем — убираем и его;
 *  - поменялся город, а новый район не передан — прежний район относился к другому городу, сбрасываем: руками район не
 *    вводят, поэтому устаревшему значению неоткуда исправиться;
 *  - переданы координаты (или определилась область) — для Минска и Минской области подставляем ближайшую станцию и
 *    минуты пешком. Если до метро METRO_WALK_LIMIT_MINUTES пешком и больше (или адрес в другой области) — метро у этого
 *    адреса нет: убираем и станцию, и введённые вручную минуты, их всё равно нигде не покажут.
 */
export function patchAddress(prevData: FormData, patch: AddressPatch): FormData {
    const next: FormData = { ...prevData, ...patch };
    if ('city' in patch && !('district' in patch) && patch.city !== prevData.city) {
        next.district = '';
    }

    const changesPlace = 'city' in patch || 'street' in patch || 'numberHome' in patch;
    const setsCoordinates = 'lat' in patch || 'lon' in patch;

    if (changesPlace && !setsCoordinates) {
        const reset = { ...next, lat: 0, lon: 0 };
        return reset.metroStation || !isMetroRegion(next.region)
            ? { ...reset, metroStation: '', minsToMetro: 0 }
            : reset;
    }

    // Область могла остаться пустой при определении адреса и появиться позже (её выбирает человек) — тогда метро
    // считаем по уже известным координатам.
    if (setsCoordinates || 'region' in patch) {
        if (next.lat <= 0 || next.lon <= 0) {
            // Считать нечего; станцию, подобранную по прежним координатам, не оставляем
            return setsCoordinates && next.metroStation ? { ...next, metroStation: '', minsToMetro: 0 } : next;
        }

        const nearest = isMetroRegion(next.region) ? findNearestMetro(next.lat, next.lon) : null;
        if (nearest) {
            return { ...next, metroStation: nearest.station.id, minsToMetro: nearest.walkMinutes };
        }
        return { ...next, metroStation: '', minsToMetro: 0 };
    }

    return next;
}

/**
 * Станцию метро выбрали вручную (или сбросили выбор — пустой id). Минуты пешком пересчитываем до выбранной станции,
 * иначе они остались бы от прежней. Нужны координаты адреса и чтобы до станции было меньше
 * METRO_WALK_LIMIT_MINUTES пешком: в остальных случаях время неизвестно — человек впишет его сам (а больше лимита его
 * всё равно не покажут). Без координат и при сбросе станции минуты не трогаем.
 */
export function chooseMetroStation(prevData: FormData, stationId: string): FormData {
    const { lat, lon } = prevData;
    if (!stationId || lat <= 0 || lon <= 0) {
        return { ...prevData, metroStation: stationId };
    }
    const walk = walkMinutesToStation(stationId, lat, lon);
    const minsToMetro = walk !== null && isMetroWalkable(walk) ? walk : 0;
    return { ...prevData, metroStation: stationId, minsToMetro };
}

// ============================================================
// 3. ФОРМАТИРОВАНИЕ
// ============================================================

/**
 * Данные формы → то, что принимает сервер. Имена полей — как у колонок таблицы apartments (numberHome, lat, lon, minsToMetro…).
 * formattedAddress не отправляем: сервер собирает его сам из города, улицы и дома.
 */
export function formatApartmentData(formData: FormData): CreateApartmentInput {
    // 0 — координаты не определились; сохранять точку (0, 0) вместо «неизвестно» нельзя
    const hasCoordinates = formData.lat > 0 && formData.lon > 0;
    // Метро сохраняем только то, которое покажут: в Минске/Минской области и меньше METRO_WALK_LIMIT_MINUTES пешком.
    const hasMetro = isMetroRegion(formData.region) && isMetroWalkable(formData.minsToMetro);
    return {
        type: formData.type,
        title: formData.title,
        city: formData.city.trim(),
        street: formData.street.trim(),
        numberHome: formData.numberHome.trim(),
        region: formData.region || undefined,
        district: formData.district.trim(),
        lat: hasCoordinates ? formData.lat : undefined,
        lon: hasCoordinates ? formData.lon : undefined,
        capacity: Number(formData.capacity ?? 0),
        price: Number(formData.price ?? 0),
        currency: formData.currency ?? 'BYN',
        image: formData.image,
        description: formData.description ?? undefined,
        rules: formData.rules ?? undefined,
        rooms: Number(formData.rooms ?? 0),
        beds: Number(formData.beds ?? 0),
        singleBeds: Number(formData.singleBeds ?? 0),
        doubleSofas: Number(formData.doubleSofas ?? 0),
        singleSofas: Number(formData.singleSofas ?? 0),
        minsToMetro: hasMetro ? Number(formData.minsToMetro) : undefined,
        metroStation: hasMetro ? formData.metroStation || undefined : undefined,
        area: formData.area ? Number(formData.area) : undefined,
        floor: formData.floor ? Number(formData.floor) : undefined,
        bathrooms: formData.bathrooms ? Number(formData.bathrooms) : undefined,
        amenities: formData.amenities ?? [],
        parking: formData.parking ?? '',
        images: formData.images ?? [],
        checkInTime: formData.checkInTime ?? undefined,
        checkOutTime: formData.checkOutTime ?? undefined,
        payerType: formData.payerType ?? 'individual',
        unp: formData.unp ?? '',
        payerName: formData.payerName ?? '',
    };
}

export function validateStep(
    step: number,
    formData: FormData,
): {
    isValid: boolean;
    error: string | null;
    fields?: FieldPath[];
} {
    switch (step) {
        case 1:
            if (!formData.type) {
                return {
                    isValid: false,
                    error: 'Выберите тип объекта',
                    fields: ['type'],
                };
            }
            return { isValid: true, error: null, fields: [] };

        case 2: {
            const badFields: FieldPath[] = [];
            if (!formData.region) {
                badFields.push('region');
            }
            // Район и район города (Центральный, Советский…) не проверяем: их определяет Яндекс по адресу, руками они
            // не вводятся, и пустыми они остаются у «городов областного подчинения» и у адреса, введённого вручную.
            if (formData.city.trim().length < 2) {
                badFields.push('city');
            }
            if (formData.street.trim().length < 2) {
                badFields.push('street');
            }
            if (formData.numberHome.trim().length < 1) {
                badFields.push('numberHome');
            }
            if (badFields.length > 0) {
                const names: Partial<Record<FieldPath, string>> = {
                    region: 'область',
                    city: 'населённый пункт',
                    street: 'улицу',
                    numberHome: 'номер дома',
                };
                // Ничего не заполнено — человек ещё не начинал с поиска адреса: подсказываем сам путь, а не перечисляем поля.
                const nothingFilled = (['region', 'city', 'street', 'numberHome'] as const).every((field) =>
                    badFields.includes(field),
                );
                return {
                    isValid: false,
                    error: nothingFilled
                        ? 'Выберите адрес из подсказок'
                        : `Укажите: ${badFields.map((field) => names[field]).join(', ')}`,
                    fields: badFields,
                };
            }
            return { isValid: true, error: null, fields: [] };
        }

        case 3: {
            const badFields: FieldPath[] = [];
            if (!formData.title.trim()) {
                badFields.push('title');
            }
            if (!formData.price) {
                badFields.push('price');
            }
            if (formData.capacity < 1) {
                badFields.push('capacity');
            }
            if (!formData.rooms || formData.rooms < 1) {
                badFields.push('rooms');
            }
            if (formData.rooms > 10) {
                badFields.push('rooms');
            }
            if (formData.unp.length < 9) {
                badFields.push('unp');
            }
            if (badFields.length > 0) {
                return {
                    isValid: false,
                    error: 'Заполните обязательные детали объекта',
                    fields: badFields,
                };
            }
            return { isValid: true, error: null, fields: [] };
        }

        case 4: {
            const badFields: FieldPath[] = [];
            if (!formData.images || formData.images.length === 0) {
                badFields.push('images');
            }
            if (!formData.image) {
                badFields.push('image');
            }
            if (badFields.length > 0) {
                return {
                    isValid: false,
                    error: 'Добавьте хотя бы одну фотографию',
                    fields: badFields,
                };
            }
            return { isValid: true, error: null, fields: [] };
        }

        default:
            return { isValid: true, error: null, fields: [] };
    }
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

export function useForm<T extends Record<string, unknown>>(initialData: T) {
    const [formData, setFormData] = useState<T>(initialData);

    const updateField = <K extends keyof T>(field: K, value: T[K]) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const resetForm = () => {
        setFormData(initialData);
    };

    const fillForm = (data: Partial<T>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    return {
        formData,
        setFormData,
        updateField,
        resetForm,
        fillForm,
    };
}
