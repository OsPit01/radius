import { createInsertSchema } from 'drizzle-zod';
// drizzle-zod строит схемы на zod/v4, поэтому и расширяем их отсюда
import { z } from 'zod/v4';

import { getRegion } from '@/lib/constants/belarus-locations';
import { getMetroStation } from '@/lib/metro';
import { apartments } from '@/server/db/schemas/apartment';

import { AMENITY_VALUES, APARTMENT_TYPE_VALUES, PARKING_TYPE_VALUES } from '../constants';
import { PAYER_TYPE_VALUES, type PayerType, UNP_RULES } from '../constants/payer';

// Сообщения, которые мы не задали сами (границы чисел, длина строк из колонок), — по-русски, а не по-английски
z.config(z.locales.ru());

// Цифры допустимы: реальные улицы бывают «улица 50 лет Победы», «улица 8 Марта».
// Номер дома в поле улицы клиент не пропускает сам (sanitizeStreet при ручном вводе).
const STREET_NAME_REGEX = /^[A-Za-zА-Яа-яЁё0-9\s.\-()]+$/;
const STREET_NAME_MESSAGE = 'В названии улицы недопустимые символы';

const PHOTO_REQUIRED_MESSAGE = 'Добавьте хотя бы одну фотографию';

/**
 * Зависимая проверка УНП: формат зависит от типа плательщика
 * (физлицо — 2 буквы + 7 цифр, ИП/компания — 9 цифр; см. payer.ts UNP_RULES).
 * superRefine, а не discriminatedUnion: у типов ОДНИ И ТЕ ЖЕ поля —
 * меняется только правило, DU заставил бы писать три копии объекта.
 * Общая для создания и обновления — одна функция, две двери.
 */
function checkUnpByPayerType(
    // Колонка nullable → на входе бывает null/undefined (drizzle-zod делает поле
    // необязательным). Пустое — НЕ проходит: строгая валидация (правило №1).
    data: { payerType: PayerType; unp?: string | null | undefined },
    ctx: z.RefinementCtx,
): void {
    const rule = UNP_RULES[data.payerType];
    if (typeof data.unp !== 'string' || !rule.pattern.test(data.unp)) {
        // Ошибка клеится к полю unp — форма подсветит именно его
        ctx.addIssue({ code: 'custom', path: ['unp'], message: rule.message });
    }
}

/**
 * Единый источник правил для объекта — таблица `apartments` (src/server/db/schema.ts).
 * Типы, обязательность, значения по умолчанию и максимальная длина строк (`varchar({ length })`) берутся из неё сами.
 * Здесь только то, чего база знать не может: тексты ошибок, диапазоны, формат.
 *
 * Эти же схемы работают и на сервере (вход tRPC), и в браузере (проверка шагов формы — см. add-object/form.ts).
 *
 * Для колонок с null или значением по умолчанию в уточнении нужно дописывать `.optional()`: при выполнении drizzle-zod
 * сам делает поле необязательным, а в типе — нет, и без этого TypeScript требовал бы присылать `null` явно.
 */
const apartmentInsertSchema = createInsertSchema(apartments, {
    // В базе колонка допускает null (уже не допускает) (новые записи), но новый объект без типа создавать нельзя -  «Тип обязателен: в БД notNull с дефолтом 'apartment', zod требует min(1) — строгость совпадает».
    type: z.enum(APARTMENT_TYPE_VALUES),
    title: (s) => s.min(3, 'Название минимум 3 символа'),
    city: (s) => s.min(2, 'Город обязателен'),
    street: (s) => s.min(2, 'Улица обязательна').regex(STREET_NAME_REGEX, STREET_NAME_MESSAGE),
    numberHome: (s) => s.min(1, 'Номер дома обязателен'),
    region: (s) => s.refine((value) => getRegion(value) !== undefined, 'Неизвестная область').optional(),
    lat: (s) => s.min(-90).max(90).optional(),
    lon: (s) => s.min(-180).max(180).optional(),
    capacity: (s) => s.min(1, 'Гостей: от 1 до 20').max(20, 'Гостей: от 1 до 20'),
    price: (s) => s.positive('Цена должна быть положительной'),
    rooms: (s) => s.min(1, 'Комнат: от 1 до 10').max(10, 'Комнат: от 1 до 10'),
    beds: (s) => s.min(0).max(20).optional(),
    singleBeds: (s) => s.min(0).max(20).optional(),
    doubleSofas: (s) => s.min(0).max(20).optional(),
    singleSofas: (s) => s.min(0).max(20).optional(),
    minsToMetro: (s) => s.min(0).optional(),
    metroStation: (s) => s.refine((id) => getMetroStation(id) !== undefined, 'Неизвестная станция метро').optional(),
    area: (s) => s.min(0).max(10_000).optional(),
    floor: (s) => s.min(0).max(100).optional(),
    bathrooms: (s) => s.min(0).max(20).optional(),
    payerType: z.enum(PAYER_TYPE_VALUES),
    parking: z.enum(PARKING_TYPE_VALUES).optional(),
    amenities: z.array(z.enum(AMENITY_VALUES)).default([]),
});

/**
 * Поля, которые заполняет сервер, а не клиент. Клиент их не присылает, а если пришлют — схема их отбросит.
 * Новая служебная колонка в таблице без записи здесь станет доступна клиенту: добавляйте её в этот список.
 */
const SERVER_OWNED_FIELDS = {
    id: true,
    createdById: true,
    status: true,
    rejectionReason: true,
    rating: true,
    reviewsCount: true,
    isAvailable: true,
    formattedAddress: true,
    createdAt: true,
    updatedAt: true,
    rank: true,
} as const;

/**
 * Устаревшие колонки: данные остаются в таблице (для отката и пока их не перенесли), но писать в них больше нельзя —
 * иначе у объекта появятся два расходящихся источника правды. Метро теперь — minsToMetro (число) и metroStation.
 * Когда колонку удалят из таблицы, её надо убрать и отсюда.
 */
const LEGACY_FIELDS = {
    metro: true,
} as const;

/** Поля, которые клиент вправе присылать, — общая основа для создания и редактирования. */
const apartmentInput = apartmentInsertSchema.omit({ ...SERVER_OWNED_FIELDS, ...LEGACY_FIELDS });

/**
 * Создание. Правила, которые действуют только здесь (при правке старых объектов их не требуем):
 *  - хотя бы одна фотография (заглавная — images[0]);
 *  - УНП — формат по типу плательщика (см. UNP_RULES в payer.ts).
 */
export const createApartmentInput = apartmentInput
    .extend({
        images: z.array(z.string()).min(1, PHOTO_REQUIRED_MESSAGE),
    })
    .superRefine(checkUnpByPayerType);

/**
 * Редактирование: тип объекта не меняем. Область, координаты и станцию метро
 * разрешаем принимать, потому что адрес теперь может менять только администратор
 * (проверка — в apartment.update). Владельцу эти поля отправить можно, но сервер откажет.
 */
export const updateApartmentInput = apartmentInput
    .omit({ type: true })
    .extend({
        id: z.number().int().positive('Некорректный идентификатор объекта'),
    })
    // Тот же формат УНП по типу плательщика, что и при создании: владелец
    // легаси-объекта с пустым/неправильным УНП обязан вписать корректный при сохранении.
    .superRefine(checkUnpByPayerType);

export type CreateApartmentInput = z.input<typeof createApartmentInput>;
export type UpdateApartmentInput = z.input<typeof updateApartmentInput>;
