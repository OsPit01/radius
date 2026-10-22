import { createIcon, createRawIcon } from './core';
import { arc, circle, rrect } from './geometry';

// Бренды — тоже одним цветом: фирменные знаки в currentColor.

const TG_PLANE =
    'M4.9 11.7 18.5 6.4c.8-.3 1.5.3 1.3 1.2l-2.3 10.5c-.2.8-1 1.1-1.7.6l-3.4-2.5-1.8 1.7c-.3.3-.9.1-.9-.4v-3.4L5 13.1c-.8-.3-.8-1.1-.1-1.4z';
const TG_FOLD = 'M10 14.7 16.4 9.2';

export const Telegram = createIcon({
    name: 'telegram',
    label: 'Telegram',
    usage: 'Подвал сайта — ссылка на бот @radius_booking_bot',
    shapes: [TG_PLANE],
    strokes: [TG_FOLD],
    cut: 1.5,
    alt: {
        3: {
            shapes: [circle(12, 12, 9.6)],
            marks: [
                `<path d="${TG_PLANE}" transform="translate(12 12) scale(.66) translate(-12 -12.2)" fill="$paint"/>`,
            ],
        },
    },
    labels: ['Самолётик', 'Самолётик-контур', 'В круге'],
});

export const Instagram = createIcon({
    name: 'instagram',
    label: 'Instagram',
    usage: 'Подвал сайта — ссылка на профиль',
    shapes: [rrect(2.8, 2.8, 18.4, 18.4, 5.6)],
    holes: [circle(12, 12, 4.2)],
    marks: [circle(17.2, 6.8, 1.2)],
});

// «G» собрана из дуги и перекладины.
const G_RING = arc(12, 12, 7.2, 0, 318);
const g = (w: number, r: string) =>
    `<path d="${r}" stroke="$fg" stroke-width="${w}" fill="none"/><path d="M12 12h${w > 3 ? 8.6 : 8.2}" stroke="$fg" stroke-width="${w}" fill="none"/>`;

export const Google = createRawIcon({
    name: 'google',
    label: 'Google',
    usage: 'Кнопка «Войти через Google» на странице входа',
    variants: [
        ['Жирная', () => g(3.6, G_RING)],
        ['Тонкая', () => g(2.4, arc(12, 12, 7.6, 0, 318))],
        [
            'В круге',
            () =>
                `<circle cx="12" cy="12" r="10" fill="$soft" stroke="$fg" stroke-width="1.8"/>` +
                `<g transform="translate(12 12) scale(.6) translate(-12 -12)">${g(3.6, G_RING)}</g>`,
        ],
    ],
});
