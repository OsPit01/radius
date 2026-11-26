// ЕДИНЫЙ источник типов уведомлений: zod-схема БД (pgEnum) и все точки
// создания уведомлений берут значения отсюда. Опечатка в типе стала
// ошибкой компиляции, а не тихим «фронт не распознал тип».

export const NOTIFICATION_TYPE_VALUES = [
    'booking_new', // владельцу: новая заявка на его квартиру
    'booking_approved', // гостю: заявку одобрили
    'booking_rejected', // гостю: заявку отклонили
    'booking_cancelled', // владельцу: гость отменил бронь
    'booking_expired', // обоим: заявка истекла без ответа
    'admin_message', // пользователю: сообщение от администратора
    'support_new_message', // админам: новое сообщение в поддержке
    'support_answer', // пользователю: ответ поддержки
    'support_closed', // пользователю: обращение закрыто
    'support_assigned', // админу: заявку передали ему
    // Смена статуса объекта (apartment-moderation): собираются шаблоном `status_${status}`,
    // где status — ApartmentStatus. Три варианта ниже.
    'status_moderation', // владельцу: объект отправлен на модерацию
    'status_active', // владельцу: объект одобрен и опубликован
    'status_inactive', // владельцу: объект снят с публикации
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPE_VALUES)[number];

// ============================================================
// КУДА ВЕДЁТ УВЕДОМЛЕНИЕ ПО БРОНИРОВАНИЮ — единый источник правды.
//
// Раньше путь писался руками в четырёх местах и «залипал» в базе:
// уведомление владельца хранило '/profile/my-bookings' (список гостя),
// поэтому кнопка «Открыть» кидала арендодателя не на заявки, а на его же
// брони. Теперь путь СЧИТЫВАЕТСЯ из типа уведомления и факта владения
// объектом — и при создании, и при чтении старых записей.
// ============================================================
export const BOOKING_LINKS = {
    owner: '/profile/manage-bookings', // арендодатель: входящие заявки
    guest: '/profile/my-bookings', // гость: мои брони
} as const;

/**
 * Определить адрес страницы для уведомления.
 *
 * @param type — тип уведомления из БД (enum, уже провалидирован схемой).
 * @param storedLink — ссылка, сохранённая в записи (может быть устаревшей).
 * @param recipientIsApartmentOwner — получатель владеет объектом из apartmentId?
 *
 * Возвращает null только для не-бронирований без ссылки (например, старое
 * уведомление админа) — тогда кнопка «Открыть» не показывается.
 */
export function getNotificationLink(
    type: NotificationType,
    storedLink: string | null,
    recipientIsApartmentOwner: boolean,
): string | null {
    switch (type) {
        // События по заявке: получатель всегда владелец объекта.
        case 'booking_new':
        case 'booking_cancelled':
            return BOOKING_LINKS.owner;
        // Решение владельца: получатель всегда гость.
        case 'booking_approved':
        case 'booking_rejected':
            return BOOKING_LINKS.guest;
        case 'booking_expired':
            // Одно событие уходит ОБОИМ. Роль здесь ненадёжна: арендодатель
            // сам может бронировать чужую квартиру. Смотрим факта владения.
            return recipientIsApartmentOwner ? BOOKING_LINKS.owner : BOOKING_LINKS.guest;
        default:
            // Остальные типы (модерация, поддержка) задают ссылку явно.
            return storedLink;
    }
}
