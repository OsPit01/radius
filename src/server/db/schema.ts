import { relations } from "drizzle-orm";
import { index, pgTableCreator, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `radius_${name}`);
// ===== ТАБЛИЦА КВАРТИР =====
export const apartments = createTable(
  "apartment",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    type: d.varchar({ length: 100 }),
    title: d.varchar({ length: 200 }).notNull(),
    city: d.varchar({ length: 100 }).notNull(),
    street: d.varchar({ length: 100 }).notNull(),
    numberHome: d.varchar({ length: 50 }).notNull(),
    district: d.varchar({ length: 200 }),
    building: d.varchar({ length: 50 }),
    formattedAddress: d.text("formattedAddress"),
    capacity: d.integer().notNull(),
    price: d.integer().notNull(),
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
    // ===== Доп. характеристики объекта (для удобства арендатора) =====
    area: d.integer(), // площадь, м²
    floor: d.integer(), // этаж
    bathrooms: d.integer(), // количество санузлов
    isAvailable: d.boolean().default(true),
    //////////////////////////////////////////
    currency: d.varchar({ length: 10 }).notNull().default("BYN"),
    amenities: d.varchar("amenities").array().default([]),
    parking: d.varchar({ length: 50 }).default(""),
    images: d.text("images").array().default([]),
    createdById: d.varchar({ length: 255 }).references(() => users.id),
    status: d.varchar({ length: 20 }).notNull().default("moderation"),
    rejectionReason: d.text(),
    // ===== Юридические данные для официальной сдачи (РБ) =====
    // Кто сдаёт: individual | ip | company — выбор владельца
    payerType: d.varchar({ length: 20 }).default("individual"),
    // УНП — 9 цифр, у физлица может отсутствовать
    unp: d.varchar({ length: 9 }),
    // Наименование организации или ФИО для ИП
    payerName: d.varchar({ length: 255 }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => /* @__PURE__ */ new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("apartment_city_idx").on(t.city),
    index("apartment_capacity_idx").on(t.capacity),
  ],
);
// ======== User ============= //
export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  phone: d.varchar({ length: 50 }),
  firstName: d.varchar({ length: 100 }),
  lastName: d.varchar({ length: 100 }),
  patronymic: d.varchar({ length: 100 }),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .$defaultFn(() => /* @__PURE__ */ new Date()),
  image: d.text(),
  role: d.varchar({ length: 50 }).notNull().default("user"),
  // ===== НОВЫЕ ПОЛЯ =====
  totalBookings: d.integer().notNull().default(0),
  totalFavorites: d.integer().notNull().default(0),
  totalApartments: d.integer().notNull().default(0),
  // null = не забанен, дата = забанен до этого момента
  bannedUntil: d.timestamp({ withTimezone: true }),
  // Telegram chat id арендодателя (куда слать уведомления о брони).
  // null = не указан, уведомления не отправляются.
  telegramChatId: d.varchar({ length: 50 }),
  // Одноразовый код для привязки Telegram (после привязки стирается).
  telegramLinkCode: d.varchar({ length: 10 }),
}));
// ======== User ============= //
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));
// ======== sessions  ============= //
export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const favorites = createTable(
  "favorite",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    apartmentId: d
      .integer()
      .notNull()
      .references(() => apartments.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.userId, t.apartmentId] }),
    index("favorite_user_id_idx").on(t.userId),
  ],
);
export const notification = createTable("notification", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id),
  type: d.varchar({ length: 50 }).notNull(),
  title: d.varchar({ length: 255 }).notNull(),
  text: d.text().notNull(),
  apartmentId: d
    .integer()
    .notNull()
    .references(() => apartments.id),
  isRead: d.boolean().notNull().default(false),
  readAt: d.timestamp({ withTimezone: true }),
  link: d.varchar({ length: 255 }),
  priority: d.varchar({ length: 20 }).default("normal"),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

export const booking = createTable("booking", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  apartmentId: d
    .integer()
    .notNull()
    .references(() => apartments.id),
  userId: d.varchar({ length: 255 }).references(() => users.id),
  guestName: d.varchar({ length: 255 }).notNull(),
  guestPhone: d.varchar({ length: 50 }).notNull(),
  guests: d.integer().notNull(),
  checkInDate: d.date({ mode: "date" }).notNull(),
  checkOutDate: d.date({ mode: "date" }).notNull(),
  message: d.text(),
  status: d.varchar({ length: 20 }).notNull().default("new"),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
}));

// ======== Streets (справочник улиц для автодополнения) ============= //
export const streets = createTable(
  "street",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 255 }).notNull(),
    region: d.varchar({ length: 100 }).notNull(),
    district: d.varchar({ length: 150 }).notNull(),
    city: d.varchar({ length: 150 }).notNull(),
  }),
  (t) => [
    index("street_city_idx").on(t.city),
    uniqueIndex("street_city_name_idx").on(t.city, t.name),
  ],
);
