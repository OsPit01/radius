// src/server/apartment-selects.ts
//
// ===== БЕЗОПАСНОСТЬ ДАННЫХ — ПРИОРИТЕТ №1 =====
//
// Здесь собраны ЕДИНЫЕ списки полей, которые можно отдавать наружу (публично).
// Правило: публичные процедуры (главная, страница объекта, избранное) берут
// поля ОТСЮДА. Так нельзя случайно вылить в JSON лишнее: email/id владельца,
// точное местоположение (formattedAddress), внутренние статусы и причины
// отклонения, служебные даты, юридические данные.
//
// Приватные процедуры (владелец смотрит свою квартиру, админ — модерация)
// работают напрямую с таблицей apartments целиком.

import { eq, notLike } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { hasPermission } from '@/lib/constants/roles';
import type * as schema from '@/server/db/schemas';
import { apartments, users } from '@/server/db/schemas';

type Database = PostgresJsDatabase<typeof schema>;

// Тестовые объекты (название начинается и заканчивается на «$test$») видны только суперадмину и выше;
// без роли (гость, OG-картинка, sitemap) скрыты всегда.
// undefined = «без условия» — только для and(): or(x, undefined) превратится в просто x.
export const hideTestApartments = (role?: string) =>
    role && hasPermission(role, 'superadmin') ? undefined : notLike(apartments.title, '$test$%$test$');

/**
 * Поля карточки объекта: ровно то, что рисует ApartmentCard.
 * Соответствует типу ApartmentSource в src/lib/apartment-format.ts
 */
export const apartmentCardColumns = {
    id: apartments.id,
    type: apartments.type,
    title: apartments.title,
    city: apartments.city,
    district: apartments.district,
    street: apartments.street,
    microdistrict: apartments.microdistrict,
    capacity: apartments.capacity,
    price: apartments.price,
    image: apartments.image,
    description: apartments.description,
    rooms: apartments.rooms,
    beds: apartments.beds,
    singleBeds: apartments.singleBeds,
    doubleSofas: apartments.doubleSofas,
    singleSofas: apartments.singleSofas,
    minsToMetro: apartments.minsToMetro,
    amenities: apartments.amenities,
};

/** Карточка + подробности для страницы объекта (без точного адреса и служебных полей). */
const apartmentPublicColumns = {
    ...apartmentCardColumns,
    street: apartments.street,
    numberHome: apartments.numberHome,
    building: apartments.building,
    microdistrict: apartments.microdistrict,
    images: apartments.images,
    area: apartments.area,
    floor: apartments.floor,
    bathrooms: apartments.bathrooms,
    checkInTime: apartments.checkInTime,
    checkOutTime: apartments.checkOutTime,
    amenities: apartments.amenities,
    rules: apartments.rules,
};

/**
 * Данные владельца для публичной страницы объекта.
 * НЕЛЬЗЯ отдавать: email, id (внутренний идентификатор), patronymic, lastName,
 * роль, счётчики и любые служебные поля.
 */
export const apartmentOwnerPublicColumns = {
    name: users.name,
    image: users.image,
    firstName: users.firstName,
    phone: users.phone,
};

/** Список карточек (главная, каталог, избранное). Без данных владельца. */
export const selectApartmentCards = (db: Database) => db.select(apartmentCardColumns).from(apartments);

/**
 * Свои объекты (личный кабинет владельца): карточка + служебные поля,
 * которые владельцу показывать можно (статус модерации, причина отказа).
 * Без данных владельца — он и так их знает.
 */
export const selectApartmentOwnList = (db: Database) =>
    db
        .select({
            apartment: {
                ...apartmentCardColumns,
                status: apartments.status,
                rejectionReason: apartments.rejectionReason,
                createdAt: apartments.createdAt,
                updatedAt: apartments.updatedAt,
            },
        })
        .from(apartments);

/** Одна квартира + публичные данные владельца (страница объекта). */
export const selectApartmentPublic = (db: Database) =>
    db
        .select({
            apartment: apartmentPublicColumns,
            user: apartmentOwnerPublicColumns,
        })
        .from(apartments)
        .leftJoin(users, eq(apartments.createdById, users.id));
