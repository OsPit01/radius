import { sql } from 'drizzle-orm';
import { check, pgTable } from 'drizzle-orm/pg-core';

// ============================================================
// РЕКВИЗИТЫ ОПЕРАТОРА — редактируются из админки (/admin/requisites).
//
// Таблица хранит РОВНО ОДНУ строку (id = 1): реквизиты у платформы одни.
// id зафиксирован как 1 — вставка без id автоматически создаёт строку с id=1,
// а повторный upsert по id=1 перезаписывает её (дубликатов не бывает).
//
// Пока строка отсутствует — сайт показывает значения по умолчанию из
// src/lib/legal/operator.ts (OPERATOR), они совпадают по полям.
// ============================================================
export const requisites = pgTable(
    'radius_requisites',
    (d) => ({
        // Всегда 1 — в таблице только одна строка реквизитов.
        id: d.integer().primaryKey().default(1),
        legalName: d.varchar({ length: 255 }).notNull(),
        unp: d.varchar({ length: 50 }).notNull(),
        legalAddress: d.varchar({ length: 500 }).notNull(),
        supportEmail: d.varchar({ length: 255 }).notNull(),
        privacyEmail: d.varchar({ length: 255 }).notNull(),
        supportTelegram: d.varchar({ length: 100 }).notNull(),
        supportTelegramUrl: d.varchar({ length: 255 }).notNull(),
        // Публичные ящики из нижней строки футера (privacy@ / support@ домена).
        footerPrivacyEmail: d.varchar({ length: 255 }).notNull(),
        footerSupportEmail: d.varchar({ length: 255 }).notNull(),
        updatedAt: d
            .timestamp({ withTimezone: true })
            .$defaultFn(() => new Date())
            .notNull(),
    }),
    () => [
        // УНП оператора — юрлицо: ровно 9 цифр. Второй рубеж защиты (первый — zod
        // в requisites router). БД сама отвергнет мусор даже при записи мимо API.
        check('requisites_unp_format', sql`"unp" ~ '^[0-9]{9}$'`),
    ],
);
