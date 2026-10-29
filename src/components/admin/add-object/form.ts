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
export type ApartmentForm = Filled<Omit<CreateApartmentInput, NotAskedFields>>;

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
        currency: 'BYN',
        rooms: 1,
        beds: 0,
        singleBeds: 0,
        doubleSofas: 0,
        singleSofas: 0,
        image: '',
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
        currency: form.currency,
        image: form.image,
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
        parking: form.parking,
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
const STEP_FIELDS = {
    1: ['type'],
    2: ['region', 'city', 'street', 'numberHome', 'district', 'lat', 'lon', 'minsToMetro', 'metroStation'],
    3: [
        'title',
        'description',
        'rules',
        'capacity',
        'price',
        'currency',
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
    4: ['image', 'images'],
} as const satisfies Record<number, readonly (keyof CreateApartmentInput)[]>;

// Колонку добавили, а шаг для неё не назначили — не скомпилируется; в тексте ошибки будет имя колонки (`missingStepFor`).
type UnassignedFields = Exclude<
    keyof CreateApartmentInput,
    (typeof STEP_FIELDS)[keyof typeof STEP_FIELDS][number] | NotAskedFields
>;
export const everyFieldHasAStep: [UnassignedFields] extends [never] ? true : { missingStepFor: UnassignedFields } =
    true;

export type StepNumber = keyof typeof STEP_FIELDS;

export type StepValidation = {
    isValid: boolean;
    /** Текст для общей плашки шага; null, если всё в порядке. */
    error: string | null;
    /** Поля, которые надо подсветить. */
    fields: FieldPath[];
    /** Сообщение у каждого такого поля. */
    messages: Partial<Record<FieldPath, string>>;
};

/** Адрес нужен для четырёх полей сразу: если не заполнено ни одно, человек ещё не начинал — подсказываем путь. */
const REQUIRED_ADDRESS_FIELDS = ['region', 'city', 'street', 'numberHome'] as const;

/**
 * Проверка шага формы. Правила не дублируются: форма превращается в то, что получит сервер (`toCreateInput`), и
 * проходит через ту же схему `createApartmentInput`, что и вход `apartment.create`. Из её ошибок остаются только
 * относящиеся к текущему шагу — остальные поля человек ещё не заполнял.
 */
export function validateStep(step: StepNumber, form: ApartmentForm): StepValidation {
    const stepFields: readonly string[] = STEP_FIELDS[step];
    const messages: Partial<Record<FieldPath, string>> = {};

    // В схеме область необязательна (у старых объектов её нет), но новый объект без неё форма не пропускает:
    // по области решаем, искать ли метро
    if (step === 2 && !form.region) {
        messages.region = 'Выберите область';
    }

    const result = createApartmentInput.safeParse(toCreateInput(form));
    for (const issue of result.error?.issues ?? []) {
        // Имена полей в схеме сервера и в форме одни и те же — переводить ничего не нужно
        const field = String(issue.path[0]) as FieldPath;
        if (!stepFields.includes(field)) {
            continue;
        }
        messages[field] ??= issue.message;
    }

    const fields = Object.keys(messages) as FieldPath[];
    if (fields.length === 0) {
        return { isValid: true, error: null, fields, messages };
    }
    const nothingFilled = step === 2 && REQUIRED_ADDRESS_FIELDS.every((field) => field in messages);
    return {
        isValid: false,
        error: nothingFilled ? 'Выберите адрес из подсказок' : (messages[fields[0]!] ?? null),
        fields,
        messages,
    };
}
