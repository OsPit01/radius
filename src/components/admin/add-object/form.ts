import type { FieldErrors, Resolver } from 'react-hook-form';

import { isParkingType } from '@/lib/constants/parking';
import { isMetroRegion } from '@/lib/metro';
import { isMetroWalkable } from '@/lib/metro-limit';
import { type CreateApartmentInput, createApartmentInput } from '@/lib/schemas/apartment';

/** В полях ввода вместо «нет значения» живут пустая строка и 0, поэтому undefined и null из типа убираем. */
type Filled<T> = { [K in keyof T]-?: NonNullable<T[K]> };

/** Этих полей форма пока не спрашивает: корпус входит в номер дома, микрорайон проставляется отдельно. */
type NotAskedFields = 'building' | 'microdistrict';

/**
 * Состояние формы добавления объекта: плоское, поля называются так же, как колонки таблицы. Почти все они выводятся
 * из серверной схемы (src/lib/schemas/apartment.ts), а она — из таблицы apartments: добавили колонку — она появилась
 * и здесь, а `toCreateInput` перестал компилироваться, пока не решите, откуда брать её значение.
 */
export type ApartmentForm = Filled<Omit<CreateApartmentInput, NotAskedFields | 'parking'>> & {
    parking: string;
};

export function createEmptyApartmentForm(): ApartmentForm {
    return {
        type: 'apartment',
        region: '',
        district: '',
        city: '',
        street: '',
        numberHome: '',
        lat: 0,
        lon: 0,
        title: '',
        capacity: 2,
        price: 100,
        rooms: 1,
        beds: 0,
        singleBeds: 0,
        doubleSofas: 0,
        singleSofas: 0,
        description: '',
        rules: '',
        minsToMetro: 0,
        metroStation: '',
        area: 0,
        floor: 1,
        bathrooms: 0,
        amenities: [],
        parking: '',
        images: [],
        checkInTime: '14:00',
        checkOutTime: '12:00',
        payerType: 'individual',
        unp: '',
        payerName: '',
    };
}

/**
 * Форма → то, что принимает `apartment.create`. Единственное место, где форма и сервер «встречаются»:
 * тип результата — схема сервера, поэтому расхождение имён или типов видно сразу, а не теряется молча.
 * Адресная строка (formattedAddress) не отправляется: сервер собирает её сам из города, улицы и дома.
 */
export function toCreateInput(form: ApartmentForm): CreateApartmentInput {
    // 0 — координаты не определились; сохранять точку (0, 0) вместо «неизвестно» нельзя
    const hasCoordinates = form.lat > 0 && form.lon > 0;
    // Метро сохраняем только то, которое покажут: в Минске/Минской области и меньше METRO_WALK_LIMIT_MINUTES пешком.
    const hasMetro = isMetroRegion(form.region) && isMetroWalkable(form.minsToMetro);

    return {
        type: form.type,
        title: form.title,
        city: form.city.trim(),
        street: form.street.trim(),
        numberHome: form.numberHome.trim(),
        region: form.region || undefined,
        district: form.district.trim(),
        lat: hasCoordinates ? form.lat : undefined,
        lon: hasCoordinates ? form.lon : undefined,
        capacity: Number(form.capacity),
        price: Number(form.price),
        description: form.description,
        rules: form.rules,
        rooms: Number(form.rooms),
        beds: Number(form.beds),
        singleBeds: Number(form.singleBeds),
        doubleSofas: Number(form.doubleSofas),
        singleSofas: Number(form.singleSofas),
        minsToMetro: hasMetro ? Number(form.minsToMetro) : undefined,
        metroStation: hasMetro ? form.metroStation || undefined : undefined,
        // 0 — «не указано»
        area: form.area ? Number(form.area) : undefined,
        floor: form.floor ? Number(form.floor) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        amenities: form.amenities,
        parking: isParkingType(form.parking) ? form.parking : undefined,
        images: form.images,
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
        payerType: form.payerType,
        unp: form.unp,
        payerName: form.payerName,
    };
}

// ============================================================
// Проверка шагов — те же правила, что и на сервере
// ============================================================

/** Поле формы для подсветки. */
export type FieldPath = keyof ApartmentForm;

/** Какие поля серверной схемы проверяет каждый шаг формы. */
export const STEP_FIELDS = {
    1: ['type'],
    2: ['region', 'city', 'street', 'numberHome', 'district', 'lat', 'lon', 'minsToMetro', 'metroStation'],
    3: [
        'title',
        'description',
        'rules',
        'capacity',
        'price',
        'rooms',
        'beds',
        'singleBeds',
        'doubleSofas',
        'singleSofas',
        'area',
        'floor',
        'bathrooms',
        'amenities',
        'parking',
        'checkInTime',
        'checkOutTime',
        'payerType',
        'unp',
        'payerName',
    ],
    4: ['images'],
} as const satisfies Record<number, readonly (keyof CreateApartmentInput)[]>;

// Колонку добавили, а шаг для неё не назначили — не скомпилируется; в тексте ошибки будет имя колонки (`missingStepFor`).
type UnassignedFields = Exclude<
    keyof CreateApartmentInput,
    (typeof STEP_FIELDS)[keyof typeof STEP_FIELDS][number] | NotAskedFields
>;
export const everyFieldHasAStep: [UnassignedFields] extends [never] ? true : { missingStepFor: UnassignedFields } =
    true;

export type StepNumber = keyof typeof STEP_FIELDS;

/** Адрес нужен для четырёх полей сразу: если не заполнено ни одно, человек ещё не начинал — подсказываем путь. */
const REQUIRED_ADDRESS_FIELDS = ['region', 'city', 'street', 'numberHome'] as const;

/**
 * Резолвер react-hook-form. Правила не дублируются: форма превращается в то, что получит сервер (`toCreateInput`), и
 * проходит через ту же схему `createApartmentInput`, что и вход `apartment.create`. Проверяется вся форма сразу;
 * какие ошибки показать, решает вызывающий — `trigger(STEP_FIELDS[step])` берёт только поля текущего шага.
 */
export const apartmentFormResolver: Resolver<ApartmentForm> = (values) => {
    const messages: Partial<Record<FieldPath, string>> = {};

    // В схеме область необязательна (у старых объектов её нет), но новый объект без неё форма не пропускает:
    // по области решаем, искать ли метро
    if (!values.region) {
        messages.region = 'Выберите область';
    }

    const result = createApartmentInput.safeParse(toCreateInput(values));
    for (const issue of result.error?.issues ?? []) {
        // Имена полей в схеме сервера и в форме одни и те же — переводить ничего не нужно
        const field = String(issue.path[0]) as FieldPath;
        messages[field] ??= issue.message;
    }

    const fields = Object.keys(messages) as FieldPath[];
    if (fields.length === 0) {
        return { values, errors: {} };
    }
    return {
        values: {},
        errors: Object.fromEntries(
            fields.map((field) => [field, { type: 'server', message: messages[field] }]),
        ) as FieldErrors<ApartmentForm>,
    };
};

/**
 * Текст для плашки над кнопками, если на шаге ошибка. Нужен шагам без поля ввода рядом с ошибкой: тип выбирают карточкой,
 * адрес ищут одной строкой поиска — подсветить «неверное поле» там нечем.
 */
export function getStepError(step: StepNumber, errors: FieldErrors<ApartmentForm>): string | null {
    const stepFields: readonly FieldPath[] = STEP_FIELDS[step];
    const failed = stepFields.filter((field) => errors[field]);
    if (failed.length === 0) {
        return null;
    }
    const nothingFilled = step === 2 && REQUIRED_ADDRESS_FIELDS.every((field) => failed.includes(field));
    return nothingFilled ? 'Выберите адрес из подсказок' : (errors[failed[0]!]?.message ?? null);
}

/** Самый ранний шаг с ошибкой: если форма не прошла проверку целиком, человека возвращают к нему. */
export function getFirstInvalidStep(errors: FieldErrors<ApartmentForm>): StepNumber | undefined {
    const steps = Object.keys(STEP_FIELDS).map(Number) as StepNumber[];

    return steps.find((step) => {
        const stepFields: readonly FieldPath[] = STEP_FIELDS[step];
        return stepFields.some((field) => errors[field]);
    });
}
