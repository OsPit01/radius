import { createIcon } from './core';
import { circle, polygon, rotate, rrect } from './geometry';

// Справочное: цена, описание, правила, время, даты, телефон, почта.

const BAG = 'M9.6 7.4C6 9.4 3.8 12.8 3.8 16.2c0 2.9 2.4 4.6 8.2 4.6s8.2-1.7 8.2-4.6c0-3.4-2.2-6.8-5.8-8.8z';
const DOLLAR =
    'M13.7 13.4c-.3-.9-1.1-1.4-1.9-1.4-1 0-1.9.5-1.9 1.5 0 2 3.9 1 3.9 3.2 0 1-.9 1.6-2 1.6-.8 0-1.6-.4-1.9-1.3M11.9 10.4v1.6M11.9 17.9v1.3';
const tilt = (x: number, y: number) => rotate(x, y, -9, 12, 12);
const NOTE_BILL = polygon([tilt(2.4, 6.4), tilt(21.6, 6.4), tilt(21.6, 18.4), tilt(2.4, 18.4)]);
const [BILL_CX, BILL_CY] = tilt(12, 12.4);
const [BILL_AX, BILL_AY] = tilt(5.8, 9.6);
const [BILL_BX, BILL_BY] = tilt(18.2, 15.2);

export const Money = createIcon({
    name: 'money',
    label: 'Деньги',
    usage: 'Секция «Цена и валюта» в форме квартиры, «Название и цена» при редактировании',
    shapes: [BAG],
    strokes: [DOLLAR],
    extras: `<path d="M8.8 3.2c1 .8 2 .8 3.2 0 1.2.8 2.2.8 3.2 0l-.9 3.4H9.7z" fill="$fg"/>`,
    alt: {
        3: {
            shapes: [NOTE_BILL],
            holes: [circle(BILL_CX, BILL_CY, 3.2)],
            marks: [circle(BILL_AX, BILL_AY, 1), circle(BILL_BX, BILL_BY, 1)],
        },
    },
    labels: ['Мешок', 'Мешок-контур', 'Банкнота'],
});

const PAPER =
    'M3 5.8a2.8 2.8 0 0 1 2.8-2.8h8.4A2.8 2.8 0 0 1 17 5.8v13.4a2.8 2.8 0 0 1-2.8 2.8H5.8A2.8 2.8 0 0 1 3 19.2z';
const PENCIL = polygon(
    (
        [
            [-1.7, -2.4],
            [1.7, -2.4],
            [1.7, 7],
            [0, 10.6],
            [-1.7, 7],
        ] as const
    ).map(([x, y]) => rotate(x, y, 45, 0, 0, 16.8, 14)),
);

export const Note = createIcon({
    name: 'note',
    label: 'Заметка',
    usage: 'Описание: вкладка на странице квартиры, секция в форме',
    shapes: [PAPER],
    strokes: ['M6.4 8.4h7M6.4 11.8h4.4'],
    halo: [PENCIL],
    extras: `<path d="${PENCIL}" fill="$fg" stroke="$fg" stroke-width=".8" stroke-linejoin="round"/>`,
    cut: 1.7,
    alt: {
        3: {
            shapes: ['M3.6 3.4h16.8v11.4l-5.8 5.8H3.6z'],
            strokes: ['M7 8.2h10M7 11.8h10M7 15.4h4.6', 'M20.4 14.8l-5.8 5.8v-3.2a2.6 2.6 0 0 1 2.6-2.6z'],
            cut: 1.7,
        },
    },
    labels: ['Заливка', 'Контур', 'Стикер'],
});

const CLIP = rrect(8, 2, 8, 4.2, 1.4);

export const Clipboard = createIcon({
    name: 'clipboard',
    label: 'Правила',
    usage: 'Правила проживания: вкладка на странице квартиры, секция в форме',
    shapes: [rrect(4.2, 3.8, 15.6, 18, 3)],
    strokes: ['M8.2 11.4l1.2 1.2 2-2.2M8.2 16l1.2 1.2 2-2.2M13.4 11.2h2.6M13.4 15.8h2.6'],
    halo: [CLIP],
    extras: `<path d="${CLIP}" fill="$fg"/>`,
    cut: 1.6,
});

export const Clock = createIcon({
    name: 'clock',
    label: 'Часы',
    usage: 'Время заезда и выезда: страница квартиры, форма, режим работы',
    shapes: [circle(12, 12, 9.4)],
    strokes: ['M12 6.8V12l3.4 2.2'],
    cut: 2,
});

export const AlarmClock = createIcon({
    name: 'alarmClock',
    label: 'Будильник',
    usage: 'Заголовок «Режим работы» на вкладке «Правила»',
    shapes: [circle(12, 13.4, 8)],
    strokes: ['M12 9.4v4l2.6 1.6'],
    cut: 1.9,
    extras:
        `<path d="M3.2 7.4A4.4 4.4 0 0 1 8 2.8M20.8 7.4A4.4 4.4 0 0 0 16 2.8M6.4 20.6 4.8 22.2M17.6 20.6l1.6 1.6" ` +
        `stroke="$fg" stroke-width="2" stroke-linecap="round" fill="none"/>`,
});

export const Calendar = createIcon({
    name: 'calendar',
    label: 'Календарь',
    usage: 'Бронирования: меню профиля, дата уведомления, счётчик броней',
    shapes: [
        'M6.6 4.6h10.8A3.6 3.6 0 0 1 21 8.2v9.6a3.6 3.6 0 0 1-3.6 3.6H6.6A3.6 3.6 0 0 1 3 17.8V8.2a3.6 3.6 0 0 1 3.6-3.6z',
    ],
    strokes: ['M3 9.8h18'],
    marks: [circle(8, 14, 1.1), circle(12, 14, 1.1), circle(16, 14, 1.1), circle(8, 17.6, 1.1), circle(12, 17.6, 1.1)],
    extras: `<path d="M8 2.4v3.6M16 2.4v3.6" stroke="$fg" stroke-width="2.2" stroke-linecap="round"/>`,
    cut: 1.7,
    alt: {
        3: {
            shapes: [
                'M6.6 4.6h10.8A3.6 3.6 0 0 1 21 8.2v9.6a3.6 3.6 0 0 1-3.6 3.6H6.6A3.6 3.6 0 0 1 3 17.8V8.2a3.6 3.6 0 0 1 3.6-3.6z',
            ],
            strokes: ['M3 9.8h18', 'M8 15.4l2.6 2.6 5.4-5.6'],
            extras: `<path d="M8 2.4v3.6M16 2.4v3.6" stroke="$fg" stroke-width="2.2" stroke-linecap="round"/>`,
            cut: 2,
        },
    },
    labels: ['Заливка', 'Контур', 'С галочкой'],
});

const PHONE =
    'M5.4 3.4h3.2a1.4 1.4 0 0 1 1.4 1.1l.6 3a1.4 1.4 0 0 1-.8 1.5l-1.4.7a11 11 0 0 0 5.2 5.2l.7-1.4a1.4 1.4 0 0 1 1.5-.8l3 .6a1.4 1.4 0 0 1 1.1 1.4v3.2a1.8 1.8 0 0 1-1.1 2.7C10.6 20.6 3.4 13.4 3.4 5.2A1.8 1.8 0 0 1 5.4 3.4z';

export const Phone = createIcon({
    name: 'phone',
    label: 'Телефон',
    usage: 'Кнопка «позвонить владельцу» на странице квартиры',
    shapes: [PHONE],
    extras:
        `<path d="M14 3.6a6.4 6.4 0 0 1 6.4 6.4M14 7.2a2.8 2.8 0 0 1 2.8 2.8" ` +
        `stroke="$fg" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,
});

export const Mail = createIcon({
    name: 'mail',
    label: 'Почта',
    usage: 'Поле e-mail на странице входа',
    shapes: [rrect(2.6, 4.8, 18.8, 14.4, 3.2)],
    strokes: ['M3.6 7.8l8.4 5.8 8.4-5.8'],
    cut: 1.8,
    labels: ['Заливка', 'Контур', 'Дуотон'],
});
