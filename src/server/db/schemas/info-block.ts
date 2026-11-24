import { pgTable } from 'drizzle-orm/pg-core';

// Пункт блока: текст обязателен, ссылка необязательна. Этот тип описывает,
// ЧТО лежит внутри jsonb-колонки items — так Drizzle знает форму данных.
export type InfoItemData = {
    text: string;
    href: string | null;
};

// Таблица блоков раздела «Информация» (страница управления бронированиями).
export const infoBlock = pgTable('radius_info_block', (d) => ({
    id: d.varchar({ length: 100 }).notNull().primaryKey(),
    icon: d.varchar({ length: 50 }).notNull(),
    title: d.varchar({ length: 255 }).notNull(),
    // $type подсказывает Drizzle, что в jsonb лежит массив объектов InfoItemData.
    items: d.jsonb('items').$type<InfoItemData[]>().notNull(),
    // Порядок показа блоков (меньше = выше).
    sortOrder: d.integer().notNull().default(0),
}));
