// ============================================================
// Схема ввода «создать бронирование».
//
// Живёт отдельно от роутера: роутер — про «как выполнить», схема —
// про «что валидно». Здесь же её переиспользуют формы в будущем.
// ============================================================

import { z } from 'zod';

import { MAX_BOOKING_GUESTS, MIN_BOOKING_GUESTS, TRIP_PURPOSE_VALUES } from '@/lib/constants/booking';
import { isValidPhoneNumber } from '@/lib/phone';
import { plural } from '@/utils/plural';

export const createBookingSchema = z.object({
    apartmentId: z.number().int().positive(),
    guestName: z.string().trim().min(1, 'Укажите имя').max(255),
    guestPhone: z
        .string()
        .trim()
        .min(1, 'Укажите телефон')
        .max(50)
        .refine(isValidPhoneNumber, 'Неверный номер телефона'),
    guests: z
        .number({ message: 'Укажите количество гостей' })
        .int()
        .min(MIN_BOOKING_GUESTS, 'Укажите количество гостей')
        .max(
            MAX_BOOKING_GUESTS,
            `Максимум ${MAX_BOOKING_GUESTS} ${plural(MAX_BOOKING_GUESTS, 'гость', 'гостя', 'гостей')}`,
        ),
    children: z
        .number()
        .int()
        .min(0, 'Число детей не может быть отрицательным')
        .max(
            MAX_BOOKING_GUESTS,
            `Максимум ${MAX_BOOKING_GUESTS} ${plural(MAX_BOOKING_GUESTS, 'ребёнок', 'ребёнка', 'детей')}`,
        )
        .optional()
        .default(0),
    checkInDate: z.coerce.date(),
    checkOutDate: z.coerce.date(),
    message: z.string().trim().max(1000).optional(),
    tripPurpose: z.enum(TRIP_PURPOSE_VALUES).optional(),
});
