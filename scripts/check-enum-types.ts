// Скрипт проверки enum-типов: сверяет pgEnum из схемы Drizzle с реальной БД.
//
// Что ловит:
//   1. Enum-тип есть в схеме, но НЕ применён в БД (забыли npm run db:sync);
//   2. Значения разошлись: добавили значение в константы, но не запушили БД
//      (или наоборот — в БД висит лишнее значение, которого нет в схеме).
//
// Плюс выводит все varchar-колонки таблиц radius_* — кандидаты на enum
// (для ручной сверки: конечный набор значений должен быть enum, а не varchar).
//
// Запуск:
//   npx tsx scripts/check-enum-types.ts
//
// Выходной код 1 — есть расхождения (можно гонять в CI перед деплоем).

import 'dotenv/config';

import postgres from 'postgres';

// Enum-объекты из схемы — ЕДИНЫЙ источник правды:
// enumName = имя типа в БД ('user_role'…), enumValues = значения из констант.
import {
    amenityEnum,
    apartmentStatusEnum,
    apartmentTypeEnum,
    checkTimeEnum,
    parkingTypeEnum,
    payerTypeEnum,
} from '../src/server/db/schemas/apartment';
import { bookingStatusEnum, cancelByEnum, tripPurposeEnum } from '../src/server/db/schemas/booking';
import { messageTypeEnum } from '../src/server/db/schemas/message';
import { notificationTypeEnum } from '../src/server/db/schemas/notification';
import { supportTicketStatusEnum } from '../src/server/db/schemas/support-ticket';
import { userRoleEnum } from '../src/server/db/schemas/user';
import { notificationChannelEnum } from '../src/server/db/schemas/user-channel';

// Все pgEnum проекта. Добавил новый enum в схему — добавь его сюда.
// Тип — только нужные поля (enumName, enumValues): PgEnum с конкретными
// значениями не приводится к общему generic'у (инвариантность Drizzle),
// поэтому берём структурный тип с нужными полями.
type AnyEnum = { enumName: string; enumValues: readonly string[] };
const ALL_ENUMS: readonly AnyEnum[] = [
    userRoleEnum,
    apartmentStatusEnum,
    payerTypeEnum,
    apartmentTypeEnum,
    parkingTypeEnum,
    amenityEnum,
    checkTimeEnum,
    bookingStatusEnum,
    cancelByEnum,
    tripPurposeEnum,
    notificationTypeEnum,
    supportTicketStatusEnum,
    messageTypeEnum,
    notificationChannelEnum,
];

const sql = postgres(process.env.DATABASE_URL ?? '', { prepare: false, max: 1 });

let failed = false;

console.log('=== Сверка enum-типов: схема Drizzle ↔ БД ===\n');

for (const e of ALL_ENUMS) {
    const name = e.enumName;
    const expected = [...e.enumValues];

    // Значения этого типа в БД (pg_enum), в порядке объявления.
    const rows = await sql`
        select e.enumlabel as value
        from pg_enum e
        join pg_type t on t.oid = e.enumtypid
        where t.typname = ${name}
        order by e.enumsortorder
    `;
    const actual = rows.map((r) => String(r.value));

    const missing = expected.filter((v) => !actual.includes(v));
    const extra = actual.filter((v) => !expected.includes(v));

    if (actual.length === 0) {
        failed = true;
        console.log(`❌ ${name}: В БД типа НЕТ (миграция не применена!)`);
    } else if (missing.length === 0 && extra.length === 0) {
        console.log(`✅ ${name}: совпадает (${actual.length} значений)`);
    } else {
        failed = true;
        console.log(`❌ ${name}: расхождение`);
        if (missing.length > 0) {
            console.log(`   нет в БД: ${missing.join(', ')}`);
        }
        if (extra.length > 0) {
            console.log(`   лишние в БД: ${extra.join(', ')}`);
        }
    }
}

// Все varchar-колонки radius_* — кандидаты на enum (для ручной сверки).
console.log('\n=== varchar-колонки radius_* (кандидаты на enum) ===');
const varchars = await sql`
    select table_name, column_name, character_maximum_length
    from information_schema.columns
    where table_schema = 'public'
      and data_type = 'character varying'
      and table_name like 'radius_%'
    order by table_name, column_name
`;
for (const v of varchars) {
    console.log(`${v.table_name}.${v.column_name} (varchar(${v.character_maximum_length}))`);
}

await sql.end();

if (failed) {
    process.exitCode = 1;
    console.log('\nИтог: ЕСТЬ расхождения — примени npm run db:sync или поправь константы.');
} else {
    console.log('\nИтог: всё совпадает ✅');
}
