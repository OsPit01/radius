import { createIcon, createRawIcon } from './core';
import { circle, HEART, spark, star5 } from './geometry';

// Статусы и «эмоции»: сердце, звезда, колокольчик, галочка-в-круге, предупреждение, инфо, песочные часы.

const STAR = star5(12, 12.9, 10, 4.4);

// «Выключенное» состояние: чистый контур без заливки — цвет задаёт родитель (text-card, text-muted-foreground…).
const ghost = (d: string) => `<path d="${d}" fill="none" stroke="$fg" stroke-width="1.9" stroke-linejoin="round"/>`;
const solid = (d: string) => `<path d="${d}" fill="$fg" stroke="$fg" stroke-width="1.8" stroke-linejoin="round"/>`;
// Блик, вырезанный из заливки.
const withCut = (d: string, cut: string) =>
    `<mask id="$id-m" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/>` +
    `<path d="${cut}" stroke="#000" stroke-width="1.7" stroke-linecap="round" fill="none"/></mask><g mask="url(#$id-m)">${solid(d)}</g>`;

export const Heart = createRawIcon({
    name: 'heart',
    label: 'Сердце',
    usage: 'Избранное: кнопка на карточке квартиры, шапка сайта, пустая страница «Избранное», пункт меню профиля',
    hasMuted: true,
    variants: [
        ['Классика', (_, o) => (o.muted ? ghost(HEART) : solid(HEART))],
        ['С бликом', (_, o) => (o.muted ? ghost(HEART) : withCut(HEART, 'M5.4 8.6c0-1.6 1-2.8 2.6-3'))],
        [
            'С искрой',
            (_, o) => (o.muted ? ghost(HEART) : solid(HEART)) + `<path d="${spark(20.6, 3.4, 2.6)}" fill="$fg"/>`,
        ],
    ],
});

export const Star = createRawIcon({
    name: 'star',
    label: 'Звезда',
    usage: 'Заглавное фото квартиры (выбор обложки, бейдж «Заглавная»)',
    hasMuted: true,
    variants: [
        ['Классика', (_, o) => (o.muted ? ghost(STAR) : solid(STAR))],
        ['С бликом', (_, o) => (o.muted ? ghost(STAR) : withCut(STAR, 'M8.6 8.4 10.8 5.6'))],
        [
            'С искрами',
            (_, o) =>
                (o.muted ? ghost(STAR) : solid(STAR)) +
                `<path d="${spark(20.6, 3.8, 2.4)}" fill="$fg"/><circle cx="3.4" cy="4.4" r="1" fill="$fg"/>`,
        ],
    ],
});

const BELL =
    'M12 2.9c-3.4 0-6 2.5-6 6v3.4c0 1.4-.5 2.7-1.5 3.8-.5.6-.1 1.5.7 1.5h13.6c.8 0 1.2-.9.7-1.5-1-1.1-1.5-2.4-1.5-3.8V8.9c0-3.5-2.6-6-6-6z';
const CLAPPER = '<path d="M9.2 19.5a2.8 2.8 0 0 0 5.6 0z" fill="$fg"/>';

export const Bell = createIcon({
    name: 'bell',
    label: 'Колокольчик',
    usage: 'Уведомления: шапка сайта (рядом со счётчиком), заглушка «Уведомлений пока нет»',
    shapes: [BELL],
    extras: CLAPPER,
    alt: {
        3: {
            shapes: [BELL],
            extras:
                CLAPPER +
                `<path d="M2.4 9.4c.2-1.9.9-3.4 2-4.6M21.6 9.4c-.2-1.9-.9-3.4-2-4.6" stroke="$fg" stroke-width="1.7" stroke-linecap="round" fill="none"/>`,
        },
    },
    labels: ['Заливка', 'Контур', 'Звенит'],
});

export const CheckCircle = createIcon({
    name: 'checkCircle',
    label: 'Успех',
    usage: 'Экраны успеха: «Заявка отправлена!», «Telegram подключен!»',
    shapes: [circle(12, 12, 9.4)],
    strokes: ['M7.4 12.5l3.2 3.2 6.2-6.6'],
    cut: 2.2,
    alt: {
        3: {
            shapes: [circle(11.4, 12.6, 8.8)],
            strokes: ['M7.2 13l3 3 6-6.4'],
            cut: 2.2,
            extras: `<path d="${spark(20.4, 3.8, 2.8)}" fill="$fg"/>`,
        },
    },
    labels: ['Заливка', 'Контур', 'С искрой'],
});

const TRI = 'M12 3.8 21.2 19.8H2.8z';

export const Warning = createIcon({
    name: 'warning',
    label: 'Предупреждение',
    usage: 'Подсказка в загрузке фото: «Выберите заглавное фото»',
    shapes: [TRI],
    strokes: ['M12 9.6v4.2'],
    marks: [circle(12, 16.9, 1.2)],
    cut: 2,
});

const BUBBLE =
    'M6 3.4h12a3.2 3.2 0 0 1 3.2 3.2v7.8a3.2 3.2 0 0 1-3.2 3.2h-4.8l-3.4 3.2c-.6.5-1.4.2-1.4-.6v-2.6H6a3.2 3.2 0 0 1-3.2-3.2V6.6A3.2 3.2 0 0 1 6 3.4z';

export const Info = createIcon({
    name: 'info',
    label: 'Информация',
    usage: 'Подсказка в окне уведомления («Нажмите на уведомление, чтобы открыть объект»)',
    shapes: [circle(12, 12, 9.4)],
    strokes: ['M12 11.2v5.4'],
    marks: [circle(12, 7.7, 1.3)],
    cut: 2.2,
    alt: {
        3: { shapes: [BUBBLE], strokes: ['M12 10.6v4'], marks: [circle(12, 7.6, 1.2)], cut: 2.2 },
    },
    labels: ['Заливка', 'Контур', 'Облачко'],
});

const HOURGLASS =
    'M7.4 4.2h9.2v2.4c0 2.6-2.1 4.2-3.2 5.4 1.1 1.2 3.2 2.8 3.2 5.4v2.4H7.4v-2.4c0-2.6 2.1-4.2 3.2-5.4C9.5 10.8 7.4 9.2 7.4 6.6z';

export const Hourglass = createIcon({
    name: 'hourglass',
    label: 'Песочные часы',
    usage: 'Загрузка фотографий (форма добавления и редактирования квартиры)',
    shapes: [HOURGLASS],
    marks: ['M9.2 18.2c.4-1.6 1.6-2.4 2.8-3.2 1.2.8 2.4 1.6 2.8 3.2z'],
    extras: `<path d="M5.4 3.2h13.2M5.4 20.8h13.2" stroke="$fg" stroke-width="2.2" stroke-linecap="round"/>`,
    labels: ['Заливка', 'Контур', 'Дуотон'],
});
