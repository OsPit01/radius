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

import { apartments, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/server/db/schema";

type Database = PostgresJsDatabase<typeof schema>;

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
  capacity: apartments.capacity,
  price: apartments.price,
  currency: apartments.currency,
  image: apartments.image,
  description: apartments.description,
  rooms: apartments.rooms,
  beds: apartments.beds,
  singleBeds: apartments.singleBeds,
  doubleSofas: apartments.doubleSofas,
  singleSofas: apartments.singleSofas,
  metro: apartments.metro,
  amenities: apartments.amenities,
};

/** Карточка + подробности для страницы объекта (без точного адреса и служебных полей). */
const apartmentPublicColumns = {
  ...apartmentCardColumns,
  street: apartments.street,
  numberHome: apartments.numberHome,
  building: apartments.building,
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
export const selectApartmentCards = (db: Database) =>
  db.select(apartmentCardColumns).from(apartments);

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
