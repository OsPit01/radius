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
