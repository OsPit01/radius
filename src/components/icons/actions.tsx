import { createIcon, createRawIcon } from './core';
import { circle, gear } from './geometry';

// Действия: поиск, фильтры, «во весь экран», отправка, настройки.

export const Search = createIcon({
    name: 'search',
    label: 'Поиск',
    usage: 'Круглая кнопка-лупа в строке поиска на главной',
    shapes: [circle(10.4, 10.4, 7)],
    strokes: ['M6.8 9.4a4 4 0 0 1 3-3'],
    cut: 1.6,
    extras: `<path d="M15.8 15.8 20.8 20.8" stroke="$fg" stroke-width="2.8" stroke-linecap="round"/>`,
});

export const Filters = createIcon({
    name: 'filters',
    label: 'Фильтры',
    usage: 'Кнопка «Фильтр» рядом с поиском, панель фильтров',
    shapes: [circle(15.5, 6, 2.6), circle(8, 12, 2.6), circle(14, 18, 2.6)],
    extras:
        `<path d="M3.5 6h9.4M18.1 6h2.4M3.5 12h2M10.6 12h9.9M3.5 18h7.9M16.6 18h3.9" ` +
        `stroke="$fg" stroke-width="2" stroke-linecap="round"/>`,
    alt: {
        3: { shapes: ['M3.5 4.6h17l-6.6 8.2v6.4l-3.8 2.2v-8.6z'], strokes: ['M7.6 8.2h8.8'], cut: 1.6 },
    },
    labels: ['Ползунки', 'Ползунки-контур', 'Воронка'],
});

const CORNERS =
    'M4 9V5.6A1.6 1.6 0 0 1 5.6 4H9M15 4h3.4A1.6 1.6 0 0 1 20 5.6V9M20 15v3.4a1.6 1.6 0 0 1-1.6 1.6H15M9 20H5.6A1.6 1.6 0 0 1 4 18.4V15';
const DIAGONAL = 'M14 5h5v5M10 19H5v-5M19 5l-6 6M5 19l6-6';
const stroke = (d: string, w: number) =>
    `<path d="${d}" stroke="$fg" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

export const Maximize = createRawIcon({
    name: 'maximize',
    label: 'Во весь экран',
    usage: 'Значок на фото в галерее квартиры («открыть на весь экран»)',
    variants: [
        ['Углы', () => stroke(CORNERS, 2.4)],
        ['Стрелки', () => stroke(DIAGONAL, 2.4)],
        [
            'В кольце',
            () =>
                `<circle cx="12" cy="12" r="9.1" fill="$soft" stroke="$fg" stroke-width="1.8"/>` +
                `<g transform="translate(12 12) scale(.58) translate(-12 -12)">${stroke(DIAGONAL, 3.2)}</g>`,
        ],
    ],
});

const PLANE = 'M21.6 2.6 2.6 10.2l7.4 3 3.6 8.2z';

export const Send = createIcon({
    name: 'send',
    label: 'Отправить',
    usage: 'Кнопка отправки сообщения в окне поддержки',
    shapes: [PLANE],
    strokes: ['M10 13.2 21.6 2.6'],
    cut: 1.6,
    alt: {
        3: {
            shapes: [PLANE],
            strokes: ['M10 13.2 21.6 2.6'],
            cut: 1.6,
            extras: `<path d="M1.8 15.4h4M3.4 19h3" stroke="$fg" stroke-width="1.8" stroke-linecap="round"/>`,
        },
    },
    labels: ['Заливка', 'Контур', 'Со следом'],
});

const GEAR = gear(12, 12, 8, 10.4, 8.3);

export const Settings = createIcon({
    name: 'settings',
    label: 'Настройки',
    usage: 'Пункт «Настройки профиля» в личном кабинете',
    shapes: [GEAR],
    holes: [circle(12, 12, 3.2)],
});
