import { createIcon } from './core';
import { circle, HEART, polygon, rotate, rrect, spark } from './geometry';

// Всё про жильё: дом, здание, кровать, диван, ванна, площадь, парковка, метро, адрес, карта, удобства.

const HOUSE = 'M4 10.8 12 3.8l8 7v8.8a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19.6z';
const DOOR = 'M10 21.2v-4.2a2 2 0 0 1 4 0v4.2';

export const Home = createIcon({
    name: 'home',
    label: 'Дом',
    usage: 'Мои объекты (меню профиля), заглушка фото в списке чатов, заголовок «Информация» при редактировании квартиры',
    shapes: [HOUSE],
    strokes: [DOOR],
    cut: 1.8,
    alt: {
        3: {
            shapes: [HOUSE],
            marks: [`<path d="${HEART}" transform="translate(8.2 9.6) scale(.34)" fill="$paint"/>`],
        },
    },
    labels: ['Заливка', 'Контур', 'С сердцем'],
});

export const Building = createIcon({
    name: 'building',
    label: 'Здание',
    usage: 'Этаж в характеристиках квартиры',
    shapes: ['M6 3h7a2 2 0 0 1 2 2v4h3.4a2 2 0 0 1 2 2v10.4H4V5a2 2 0 0 1 2-2z'],
    marks: [
        'M7 6.4h2.2v2.2H7z',
        'M10.6 6.4h2.2v2.2h-2.2z',
        'M7 10.4h2.2v2.2H7z',
        'M10.6 10.4h2.2v2.2h-2.2z',
        'M16.6 12.4h2v2h-2z',
        'M16.6 16h2v2h-2z',
    ],
    strokes: ['M8.4 21.4v-4h2.4v4'],
    cut: 1.6,
});

export const Bed = createIcon({
    name: 'bed',
    label: 'Кровать',
    usage: 'Места для сна: страница квартиры, форма редактирования',
    shapes: ['M5.4 12.6h14a2.2 2.2 0 0 1 2.2 2.2V18H5.4z', rrect(6.8, 8.4, 5.2, 4.2, 1.8)],
    extras: `<path d="M3.4 5.4v15.2M21.4 18v2.6" stroke="$fg" stroke-width="2.4" stroke-linecap="round"/>`,
    alt: {
        3: {
            shapes: ['M5.4 12.6h14a2.2 2.2 0 0 1 2.2 2.2V18H5.4z', rrect(6.8, 8.4, 5.2, 4.2, 1.8)],
            extras:
                `<path d="M3.4 5.4v15.2M21.4 18v2.6" stroke="$fg" stroke-width="2.4" stroke-linecap="round"/>` +
                `<path d="M17.8 2.6a3.7 3.7 0 1 0 3.4 5.6 4.3 4.3 0 0 1-3.4-5.6z" fill="$fg"/>`,
        },
    },
    labels: ['Заливка', 'Контур', 'С луной'],
});

export const Sofa = createIcon({
    name: 'sofa',
    label: 'Диван',
    usage: 'Вместимость: заголовок секции в форме, диваны в местах для сна',
    shapes: [
        'M7.4 4.4h9.2a2.8 2.8 0 0 1 2.8 2.8V10h.2a2.4 2.4 0 0 1 2.4 2.4v4.4a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 16.8v-4.4A2.4 2.4 0 0 1 4.4 10h.2V7.2a2.8 2.8 0 0 1 2.8-2.8z',
    ],
    strokes: ['M5.6 10.4v4h12.8v-4'],
    cut: 1.6,
    extras: `<path d="M5 19.8v1.6M19 19.8v1.6" stroke="$fg" stroke-width="2.2" stroke-linecap="round"/>`,
});

const TUB = 'M2.6 11.8h18.8v1.2a6.2 6.2 0 0 1-6.2 6.2H8.8A6.2 6.2 0 0 1 2.6 13z';

export const Bath = createIcon({
    name: 'bath',
    label: 'Ванна',
    usage: 'Количество санузлов на странице квартиры',
    shapes: [TUB],
    extras:
        `<path d="M6.6 20.2v.8M17.4 20.2v.8M5.4 11.4V6.8a2.4 2.4 0 0 1 2.4-2.4h1.8" stroke="$fg" stroke-width="2" stroke-linecap="round" fill="none"/>` +
        `<g stroke="$fg" stroke-width="1.5" fill="none"><circle cx="14.4" cy="6.6" r="2.2"/><circle cx="18.6" cy="4.4" r="1.3"/><circle cx="18.2" cy="8.2" r=".9"/></g>`,
});

const TRIANGLE = 'M3.6 3.6v16.8h16.8z';
const TRI_TICKS = 'M8 20.4v-2M12 20.4v-1.4M16 20.4v-2M3.6 8h2M3.6 12h1.4M3.6 16h2';
const DIAG = (pts: readonly (readonly [number, number])[]) => pts.map(([x, y]) => rotate(x, y, -45, 12, 12));
const RULER = polygon(
    DIAG([
        [1.6, 8],
        [22.4, 8],
        [22.4, 16],
        [1.6, 16],
    ]),
);
const RULER_TICKS = [5.4, 8.8, 12.2, 15.6, 19]
    .map((x, i) => {
        const [x1, y1] = rotate(x, 8, -45, 12, 12);
        const [x2, y2] = rotate(x, i % 2 === 0 ? 11 : 10, -45, 12, 12);
        return `M${x1} ${y1}L${x2} ${y2}`;
    })
    .join('');

export const Ruler = createIcon({
    name: 'ruler',
    label: 'Площадь',
    usage: 'Площадь квартиры (м²) на странице объекта',
    shapes: [TRIANGLE],
    strokes: [TRI_TICKS],
    cut: 1.3,
    alt: { 3: { shapes: [RULER], strokes: [RULER_TICKS], cut: 1.5 } },
    labels: ['Заливка', 'Контур', 'Линейка'],
});

const CAR =
    'M3.4 17.6A1.6 1.6 0 0 1 1.8 16v-4a2 2 0 0 1 1.6-2l1.4-.3 1.9-4.1A2.2 2.2 0 0 1 8.7 4.4h6.6a2.2 2.2 0 0 1 2 1.2l1.9 4.1 1.4.3a2 2 0 0 1 1.6 2v4a1.6 1.6 0 0 1-1.6 1.6z';
const WHEELS = `<g fill="$fg"><circle cx="7.2" cy="17.8" r="2.4"/><circle cx="16.8" cy="17.8" r="2.4"/></g>`;

export const Car = createIcon({
    name: 'car',
    label: 'Автомобиль',
    usage: 'Секция «Парковка» в форме добавления квартиры',
    shapes: [CAR],
    strokes: ['M4.8 9.8h14.4M12 4.8v5'],
    cut: 1.5,
    extras: WHEELS,
    alt: {
        3: {
            shapes: [rrect(2.6, 2.6, 18.8, 18.8, 5)],
            strokes: ['M9.8 18V6.6h3.6a3.5 3.5 0 0 1 0 7H9.8'],
            cut: 2.4,
        },
    },
    labels: ['Заливка', 'Контур', 'Знак парковки'],
});

export const Metro = createIcon({
    name: 'metro',
    label: 'Метро',
    usage: 'Время до метро: страница квартиры, секция «Расположение» в форме',
    shapes: [rrect(5, 2.8, 14, 15.6, 3.6)],
    holes: [rrect(7.8, 5.8, 8.4, 4.8, 1.6)],
    marks: [circle(8.8, 14.6, 1.2), circle(15.2, 14.6, 1.2)],
    extras: `<path d="M8 18.8 6.4 21.8M16 18.8l1.6 3" stroke="$fg" stroke-width="2.2" stroke-linecap="round"/>`,
    alt: {
        3: { shapes: [circle(12, 12, 9.4)], strokes: ['M7 16.2V8l5 5.2L17 8v8.2'], cut: 2.3 },
    },
    labels: ['Заливка', 'Контур', 'Знак «М»'],
});

const PIN = 'M12 22.2S4.6 15.8 4.6 9.7a7.4 7.4 0 0 1 14.8 0c0 6.1-7.4 12.5-7.4 12.5z';

export const MapPin = createIcon({
    name: 'mapPin',
    label: 'Адрес',
    usage: 'Строка адреса на странице квартиры',
    shapes: [PIN],
    holes: [circle(12, 9.7, 2.8)],
});

export const MapView = createIcon({
    name: 'mapView',
    label: 'Карта',
    usage: 'Вкладка «Карта» на странице квартиры',
    shapes: ['M2.4 6.6 8.4 4l7.2 2.6 6-2.6v13.4l-6 2.6-7.2-2.6-6 2.6z'],
    strokes: ['M8.4 4v13.4M15.6 6.6V20'],
    marks: ['M12 15s-2.4-2-2.4-3.8a2.4 2.4 0 0 1 4.8 0C14.4 13 12 15 12 15z'],
    cut: 1.5,
});

export const Sparkles = createIcon({
    name: 'sparkles',
    label: 'Искры',
    usage: 'Удобства: вкладка на странице квартиры и секция в форме',
    shapes: [spark(10.4, 13.6, 8.6)],
    extras: `<path d="${spark(19.2, 5.2, 3.4)}" fill="$fg"/><path d="${spark(4.2, 4.6, 2.2)}" fill="$fg"/>`,
});
