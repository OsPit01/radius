// Хук формы бронирования (модалка «Забронировать»).
//
// ВСЯ логика формы живёт здесь, а не в компоненте: состояния полей,
// подтягивание имени/телефона из профиля, валидация, мутация отправки.
// BookingButton остаётся тонким (кнопка + модалка), BookingForm — чистая вёрстка.
// Разделение: логика (хук) ↔ вёрстка (компоненты) — один источник правды состояния.

import { useEffect, useRef, useState } from 'react';

import { useSession } from 'next-auth/react';

import { reportConversion } from '@/lib/analytics';
import {
    DEFAULT_BOOKING_GUESTS,
    MAX_BOOKING_GUESTS,
    MIN_BOOKING_GUESTS,
    type TripPurpose,
} from '@/lib/constants/booking';
import { addDaysISO, todayISO } from '@/lib/date';
import {
    getCountryCodePrefixFromNumber,
    getExamplePhoneNumber,
    isValidPhoneNumber,
    limitNationalNumberLength,
    toE164,
} from '@/lib/phone';
import { api } from '@/trpc/react';

/** Аргументы формы бронирования (совпадают с пропсами BookingButton). */
export type UseBookingFormArgs = {
    apartmentId: number;
    apartmentTitle: string;
    /** Сколько гостей выбрано в поиске — стартовое значение поля. */
    initialGuests?: number;
    /** Сколько детей выбрано в поиске — стартовое значение поля «Дети». */
    initialChildren?: number;
    /** Вместимость квартиры — верхняя граница поля. */
    apartmentCapacity?: number;
};

/** Ошибки формы (по имени поля). */
export type BookingFormErrors = {
    name?: string;
    phone?: string;
    dates?: string;
};

export function useBookingForm({
    apartmentId,
    apartmentTitle,
    initialGuests = DEFAULT_BOOKING_GUESTS,
    initialChildren = 0,
    apartmentCapacity,
}: UseBookingFormArgs) {
    const { data: session } = useSession();
    // Данные авторизованного пользователя из БД — чтобы подтянуть его телефон.
    const userId = session?.user?.id ?? '';
    const { data: user } = api.user.getById.useQuery({ id: userId }, { enabled: !!userId });

    const [open, setOpen] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    // Выбранная страна телефона (ISO2-код). Нужна, чтобы показывать формат
    // номера под конкретным флагом (placeholder и подсказка меняются со страной).
    const [country, setCountry] = useState('BY');
    // Последний известный "+код" страны ("+375", "+7" и т.д.). Храним в ref,
    // чтобы восстановить код, если пользователь его стёр. Работает для любой страны.
    const lastPhonePrefixRef = useRef('+375');
    // Не больше, чем вмещает квартира, но и не больше общего лимита площадки.
    const maxGuests = Math.min(apartmentCapacity ?? MAX_BOOKING_GUESTS, MAX_BOOKING_GUESTS);
    // Минимально допустимая дата заезда — сегодня (локально).
    const today = todayISO();
    // Стартовые значения гостей (приходят из поиска через URL ?guests&children).
    const initialChildrenCount = Math.min(Math.max(initialChildren, 0), maxGuests - MIN_BOOKING_GUESTS);
    const initialAdultsCount = Math.min(
        Math.max(initialGuests - initialChildrenCount, MIN_BOOKING_GUESTS),
        maxGuests - initialChildrenCount,
    );
    const [adults, setAdults] = useState(initialAdultsCount);
    const [children, setChildren] = useState(initialChildrenCount);
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    // Выезд не раньше заезда+1 день; пока заезд не выбран — не раньше завтра.
    const minCheckOut = checkInDate ? addDaysISO(checkInDate, 1) : addDaysISO(today, 1);
    // Пример номера под выбранным флагом (для placeholder и сообщения об ошибке).
    const exampleNumber = getExamplePhoneNumber(country);
    const [message, setMessage] = useState('');
    // Цель поездки: '' — не выбрана (поле необязательное), иначе одно из TRIP_PURPOSE_VALUES.
    const [tripPurpose, setTripPurpose] = useState<TripPurpose | ''>('');
    const [errors, setErrors] = useState<BookingFormErrors>({});

    useEffect(() => {
        // Подтягиваем имя авторизованного пользователя.
        const name = session?.user?.name;
        if (name) {
            setGuestName((prev) => prev || name);
        }
        // Подтягиваем телефон из профиля (БД) — только если поле ещё пустое.
        const phone = toE164(user?.phone);
        if (phone) {
            const prefix = getCountryCodePrefixFromNumber(phone);
            if (prefix) {
                lastPhonePrefixRef.current = prefix;
            }
            setGuestPhone((prev) => prev || phone);
        }
    }, [session, user]);

    const createBooking = api.bookings.create.useMutation({
        onSuccess: () => {
            reportConversion();
            // Модалку НЕ закрываем: гость должен увидеть подтверждение отправки.
            // Состояние мутации сбросит handleClose, поэтому следующий вызов
            // модалки всегда начнётся с пустой формы.
            setGuestName(session?.user?.name ?? '');
            setGuestPhone('');
            setAdults(initialAdultsCount);
            setChildren(initialChildrenCount);
            setCheckInDate('');
            setCheckOutDate('');
            setMessage('');
            setTripPurpose('');
            setErrors({});
        },
    });

    // Единый путь закрытия окна: гасим его И сбрасываем isSuccess/isError/isPending.
    const handleClose = () => {
        setOpen(false);
        createBooking.reset();
    };

    // Открыть форму: сбрасываем прошлое состояние мутации (иначе после закрытия
    // нестандартным путём гость увидел бы старый экран «успеха», а не форму).
    const openForm = () => {
        createBooking.reset();
        setOpen(true);
    };

    // Код страны стирать нельзя, причём для ЛЮБОЙ страны (не только BY/RU).
    // Если код потерян — восстанавливаем последний известный "+код".
    const handlePhoneChange = (value?: string) => {
        // Обрезаем национальную часть до длины, допустимой для страны (для BY — 9 цифр),
        // чтобы лишние цифры физически не вводились.
        const next = limitNationalNumberLength(value ?? '');

        // Начинается с «+» — запоминаем код страны (если удалось распознать)
        // и просто сохраняем значение.
        if (next.startsWith('+')) {
            const prefix = getCountryCodePrefixFromNumber(next);
            if (prefix) {
                lastPhonePrefixRef.current = prefix;
            }
            setGuestPhone(next);
            return;
        }

        // Код страны стёрли полностью. Восстанавливаем код + цифры номера.
        const digits = next.replace(/\D/g, '');
        const prefixDigits = lastPhonePrefixRef.current.slice(1);
        const national = digits.startsWith(prefixDigits) ? digits.slice(prefixDigits.length) : digits;
        setGuestPhone(lastPhonePrefixRef.current + national);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: BookingFormErrors = {};
        if (!guestName.trim()) {
            newErrors.name = 'Укажите имя';
        }
        if (!isValidPhoneNumber(guestPhone)) {
            newErrors.phone = `Введите корректный номер (например: ${exampleNumber ?? '+375 29 123-45-67'})`;
        }
        if (!checkInDate || !checkOutDate) {
            newErrors.dates = 'Укажите даты заезда и выезда';
        } else if (checkInDate < today) {
            // Строки вида YYYY-MM-DD сравниваются лексикографически — это и есть сравнение дат.
            newErrors.dates = 'Дата заезда не может быть в прошлом';
        } else if (checkOutDate <= checkInDate) {
            newErrors.dates = 'Дата выезда должна быть позже даты заезда';
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }
        createBooking.mutate({
            apartmentId,
            guestName: guestName.trim(),
            guestPhone,
            guests: adults + children,
            children,
            checkInDate: new Date(checkInDate),
            checkOutDate: new Date(checkOutDate),
            message: message.trim() || undefined,
            // '' → undefined: zod-схема опциональна, пустую строку не отправляем.
            tripPurpose: tripPurpose || undefined,
        });
    };

    return {
        // Состояние модалки и мутации.
        session,
        open,
        openForm,
        handleClose,
        isSuccess: createBooking.isSuccess,
        isError: createBooking.isError,
        isPending: createBooking.isPending,
        errorMessage: createBooking.error?.message ?? 'Не удалось отправить заявку',
        // Данные для заголовка формы.
        apartmentTitle,
        // Поля формы + сеттеры.
        guestName,
        setGuestName,
        guestPhone,
        handlePhoneChange,
        country,
        setCountry,
        exampleNumber,
        adults,
        setAdults,
        children,
        setChildren,
        maxGuests,
        apartmentCapacity,
        checkInDate,
        setCheckInDate,
        checkOutDate,
        setCheckOutDate,
        today,
        minCheckOut,
        message,
        setMessage,
        tripPurpose,
        setTripPurpose,
        errors,
        handleSubmit,
    };
}
