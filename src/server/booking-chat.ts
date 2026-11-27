// ============================================================
// СИСТЕМНЫЕ СООБЩЕНИЯ ЧАТА БРОНИ + КРАСИВЫЕ TELEGRAM-ТЕКСТЫ
//
// Зачем отдельный модуль: роутер bookings знает про СТАТУСЫ и БД,
// но не должен знать, как «красиво» пишутся сообщения. Здесь —
// все тексты (чат и Telegram); роутер зовёт одну функцию.
//
// Хочешь поменять формулировку или добавить деталь — правишь
// ОДИН файл, обновляется везде.
// ============================================================

import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as schema from '@/server/db/schemas';
import { conversation, message } from '@/server/db/schemas';
import { escapeHtml } from '@/server/notify';

type Database = PostgresJsDatabase<typeof schema>;

/** Дата для текста: «26.11.2026». */
function formatDate(value: Date): string {
    return value.toLocaleDateString('ru-RU');
}

/** Найти диалог брони (создаётся один раз при бронировании). */
async function findBookingConversation(db: Database, bookingId: number): Promise<{ id: number } | null> {
    const [conv] = await db
        .select({ id: conversation.id })
        .from(conversation)
        .where(eq(conversation.bookingId, bookingId));
    return conv ?? null;
}

/**
 * Вставить системное сообщение в чат брони, адресованное конкретному
 * участнику (targetUserId). Диалога нет (битые данные) — молча пропускаем:
 * бронь важнее, а сообщение вторично.
 */
export async function insertBookingSystemMessage(
    db: Database,
    bookingId: number,
    // senderId/targetUserId — nullable: системное событие (автоотмена заявки)
    // не имеет человека-отправителя, а адресат может быть удалённым аккаунтом.
    data: { senderId: string | null; targetUserId: string | null; text: string; link?: string | null },
): Promise<void> {
    const conv = await findBookingConversation(db, bookingId);
    if (!conv) {
        return;
    }
    await db.insert(message).values({
        conversationId: conv.id,
        senderId: data.senderId,
        targetUserId: data.targetUserId,
        text: data.text,
        link: data.link ?? null,
        type: 'system',
    });
}

/** Тексты решений по брони (системные сообщения в чат). */
export const BOOKING_DECISION_TEXTS = {
    approved: '✅ Арендодатель подтвердил бронирование',
    rejected: '❌ Арендодатель отклонил бронирование',
    cancelledByGuest: 'Гость отменил бронирование',
    expired: '⏰ Заявка отменена автоматически: время ожидания истекло',
} as const;

/** Сводка ВЛАДЕЛЬЦУ при новой заявке (системное сообщение в чат). */
export function buildOwnerSummary(args: {
    title: string;
    guestName: string;
    guestPhone: string;
    guests: number;
    children: number;
    checkIn: Date;
    checkOut: Date;
}): string {
    const adults = args.guests - args.children;
    return [
        '📋 Новая заявка на бронирование:',
        `Квартира: ${args.title}`,
        `Гость: ${args.guestName}`,
        `Телефон: ${args.guestPhone}`,
        `Взрослых: ${adults} · Детей: ${args.children}`,
        `Заезд: ${formatDate(args.checkIn)} — Выезд: ${formatDate(args.checkOut)}`,
    ].join('\n');
}

/** Сводка ГОСТЮ сразу после бронирования (системное сообщение в чат). */
export function buildGuestSummary(args: { title: string; ownerName: string; checkIn: Date; checkOut: Date }): string {
    return [
        '📋 Вы забронировали:',
        `Квартира: ${args.title}`,
        `Арендодатель: ${args.ownerName}`,
        `Заезд: ${formatDate(args.checkIn)} — Выезд: ${formatDate(args.checkOut)}`,
    ].join('\n');
}

// ============================================================
// TELEGRAM: красивые тексты со всеми деталями бронирования
//
// Каждый тип события — свой эмодзи и свой состав деталей.
// Все данные приходят одним объектом BookingTelegramData —
// заполняй те поля, что есть; отсутствующие просто не выводятся.
// ============================================================

/** Все возможные детали брони для telegram-текста. */
export type BookingTelegramData = {
    title: string;
    address?: string | null;
    price?: number | null;
    guestName?: string | null;
    guestPhone?: string | null;
    guests?: number | null;
    children?: number | null;
    checkIn?: Date | null;
    checkOut?: Date | null;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    tripPurpose?: string | null;
    message?: string | null;
    reason?: string | null;
    expiryHours?: number | null;
};

/** Строка «поле: значение» — только если значение есть. */
function line(label: string, value: string | null | undefined): string | null {
    if (!value) {
        return null;
    }
    return `<b>${label}:</b> ${escapeHtml(value)}`;
}

/** Дата «заезд — выезд» одной строкой (если обе есть). */
function datesLine(data: BookingTelegramData): string | null {
    if (!data.checkIn || !data.checkOut) {
        return null;
    }
    return `<b>Даты:</b> ${formatDate(data.checkIn)} → ${formatDate(data.checkOut)}`;
}

/** Время заезда/выезда (если указаны). */
function timesLine(data: BookingTelegramData): string | null {
    if (!data.checkInTime && !data.checkOutTime) {
        return null;
    }
    const parts = [];
    if (data.checkInTime) {
        parts.push(`заезд с ${data.checkInTime}`);
    }
    if (data.checkOutTime) {
        parts.push(`выезд до ${data.checkOutTime}`);
    }
    return `<b>Время:</b> ${parts.join(', ')}`;
}

/** Гости: взрослые + дети (если есть). */
function guestsLine(data: BookingTelegramData): string | null {
    if (data.guests === null || data.guests === undefined) {
        return null;
    }
    const children = data.children ?? 0;
    return children > 0 ? `<b>Гостей:</b> ${data.guests} (детей: ${children})` : `<b>Гостей:</b> ${data.guests}`;
}

/** Цена за сутки (если известна). */
function priceLine(data: BookingTelegramData): string | null {
    if (data.price === null || data.price === undefined) {
        return null;
    }
    return `<b>Цена:</b> ${data.price} Br / сутки`;
}

/** Собрать готовый HTML-текст: эмодзи-заголовок + детали, которые заполнены. */
function assemble(emoji: string, headline: string, details: (string | null)[]): string {
    const filled = details.filter((d): d is string => d !== null);
    return [emoji + ' ' + headline, '', ...filled].join('\n');
}

/**
 * Тип события брони для telegram-текста. Конечный набор: опечатка
 * в kind ловится компилятором, а не «тихо» уходит в default-ветку.
 */
export type BookingTelegramKind = 'new' | 'approved' | 'rejected' | 'cancelled' | 'expired_owner' | 'expired_guest';

/**
 * Красивый текст для Telegram по типу события брони.
 * kind:
 *   new          — владельцу: новая заявка
 *   approved     — гостю: подтверждена
 *   rejected     — гостю: отклонена
 *   cancelled    — владельцу: гость отменил
 *   expired_owner — владельцу: заявка истекла
 *   expired_guest — гостю: заявка истекла
 */
export function buildBookingTelegramText(kind: BookingTelegramKind, data: BookingTelegramData): string {
    switch (kind) {
        case 'new':
            return assemble('📋', '<b>Новая заявка на бронирование</b>', [
                line('Квартира', data.title),
                line('Адрес', data.address),
                line('Гость', data.guestName),
                line('Телефон', data.guestPhone),
                datesLine(data),
                timesLine(data),
                guestsLine(data),
                line('Цель поездки', data.tripPurpose),
                line('Комментарий', data.message),
            ]);
        case 'approved':
            return assemble('✅', '<b>Бронирование подтверждено</b>', [
                line('Квартира', data.title),
                line('Адрес', data.address),
                datesLine(data),
                timesLine(data),
                priceLine(data),
            ]);
        case 'rejected':
            return assemble('❌', '<b>Заявка отклонена</b>', [
                line('Квартира', data.title),
                line('Адрес', data.address),
                datesLine(data),
                timesLine(data),
                priceLine(data),
                line('Причина', data.reason),
            ]);
        case 'cancelled':
            return assemble('🚫', '<b>Бронирование отменено гостем</b>', [
                line('Квартира', data.title),
                line('Адрес', data.address),
                line('Гость', data.guestName),
                line('Телефон', data.guestPhone),
                datesLine(data),
                timesLine(data),
                guestsLine(data),
                line('Цель поездки', data.tripPurpose),
                line('Комментарий', data.message),
                line('Причина', data.reason),
            ]);
        case 'expired_owner':
            return assemble('⏰', '<b>Заявка истекла без ответа</b>', [
                line('Квартира', data.title),
                line('Адрес', data.address),
                line('Гость', data.guestName),
                line('Телефон', data.guestPhone),
                datesLine(data),
                timesLine(data),
                guestsLine(data),
                line('Цель поездки', data.tripPurpose),
                line('Комментарий', data.message),
                data.expiryHours ? `Гость не получил ответа в течение ${data.expiryHours} ч.` : null,
            ]);
        case 'expired_guest':
            return assemble('⏰', '<b>Заявка отменена автоматически</b>', [
                line('Квартира', data.title),
                line('Адрес', data.address),
                priceLine(data),
                datesLine(data),
                timesLine(data),
                data.expiryHours ? `Время ожидания (${data.expiryHours} ч) истекло.` : null,
            ]);
        default:
            return assemble('📋', `<b>${escapeHtml(data.title)}</b>`, [datesLine(data)]);
    }
}
