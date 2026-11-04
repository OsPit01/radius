import { sql } from 'drizzle-orm';
import { check, index, pgEnum, pgTable } from 'drizzle-orm/pg-core';

import { APARTMENT_TYPE_VALUES } from '@/lib/constants';
import { PARKING_TYPE_VALUES } from '@/lib/constants/parking';
import { PAYER_TYPE_VALUES } from '@/lib/constants/payer';

import { users } from './user';

export const apartmentStatusEnum = pgEnum('apartment_status', [
    'moderation', // ждёт проверки админом
    'active', // опубликована, видна всем
    'inactive', // отклонена (причина в rejectionReason)
]);

export const payerTypeEnum = pgEnum('payer_type', PAYER_TYPE_VALUES);
export const apartmentTypeEnum = pgEnum('apartment_type', APARTMENT_TYPE_VALUES);
export const parkingTypeEnum = pgEnum('parking_type', PARKING_TYPE_VALUES);
export const apartments = pgTable(
    'radius_apartment',
    (d) => ({
        id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
        type: apartmentTypeEnum('type').notNull().default('apartment'),
        title: d.varchar({ length: 200 }).notNull(),
        city: d.varchar({ length: 100 }).notNull(),
        street: d.varchar({ length: 100 }).notNull(),
        numberHome: d.varchar({ length: 50 }).notNull(),
        region: d.varchar({ length: 100 }), // область: value из BELARUS_REGIONS («minsk-region»); у старых объектов пусто
        district: d.varchar({ length: 200 }),
        microdistrict: d.varchar({ length: 200 }),
        building: d.varchar({ length: 50 }),
        formattedAddress: d.text('formattedAddress'),
        lat: d.doublePrecision(),
        lon: d.doublePrecision(),
        capacity: d.integer().notNull(),
        price: d.integer().notNull(), // цена за сутки в BYN (BASE_CURRENCY); валюта не выбирается — закон РБ
        image: d.text().notNull(),
        description: d.text(),
        rules: d.text(),
        checkInTime: d.varchar({ length: 50 }),
        checkOutTime: d.varchar({ length: 50 }),
        reviewsCount: d.integer(),
        rating: d.doublePrecision().default(0),
        rooms: d.integer().notNull(),
        beds: d.integer().notNull().default(0),
        singleBeds: d.integer().notNull().default(0),
        doubleSofas: d.integer().notNull().default(0),
        singleSofas: d.integer().notNull().default(0),
        metro: d.varchar({ length: 100 }),
        minsToMetro: d.integer(), // расстояние до ближайшего метро (при < 60минут)
        metroStation: d.varchar({ length: 50 }), // ближайшая станция метро (при < 60мин)
        area: d.integer(), // площадь, м²
        floor: d.integer(),
        bathrooms: d.integer(),
        isAvailable: d.boolean().default(true),
        amenities: d.varchar('amenities').array().default([]),
        parking: parkingTypeEnum('parking'), // NULL = не указано; absent = парковки нет
        images: d.text('images').array().default([]),
        createdById: d.varchar({ length: 255 }).references(() => users.id),
        status: apartmentStatusEnum('status').notNull().default('moderation'),
        rejectionReason: d.text(),
        payerType: payerTypeEnum('payerType').notNull().default('individual'),
        unp: d.varchar({ length: 9 }),
        payerName: d.varchar({ length: 255 }),
        createdAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => /* @__PURE__ */ new Date())
            .notNull(),
        updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    }),
    (t) => [
        index('apartment_city_idx').on(t.city),
        index('apartment_capacity_idx').on(t.capacity),
        index('apartment_public_idx')
            .on(t.city, t.price)
            .where(sql` ${t.status} = 'active'`),
        // УНП: формат зависит от типа плательщика (см. payer.ts UNP_RULES):
        //   физлицо — 2 ЗАГЛАВНЫЕ латинские буквы + 7 цифр (LLNNNNNNN, пример MA1953684);
        //   ИП/компания — ровно 9 цифр.
        // Пустая строка — исключение для известного легаси (физлица дозаполнят при
        // первом редактировании: zod-схема не пропускает пустое при сохранении).
        // Любой иной мусор БД отвергает САМА — даже при записи мимо API, прямым SQL.
        check(
            'apartment_unp_format',
            sql`(
                ("payerType" = 'individual' and ("unp" ~ '^[A-Z]{2}[0-9]{7}$' or "unp" = ''))
                or
                ("payerType" <> 'individual' and ("unp" ~ '^[0-9]{9}$' or "unp" = ''))
            )`,
        ),
    ],
);
