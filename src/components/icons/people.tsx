import { createIcon } from './core';
import { circle, rrect, spark, star5 } from './geometry';

// Люди и разделы кабинета: чат, пользователь(и), модерация, просмотры, статистика, камера.

const BUBBLE =
    'M12 3C6.9 3 2.8 6.6 2.8 11c0 2 .8 3.8 2.2 5.2L4 20.4c-.1.5.4.9.9.7l4.1-1.7c1 .3 2 .4 3 .4 5.1 0 9.2-3.6 9.2-8s-4.1-8.8-9.2-8.8z';
const FRONT_BUBBLE =
    'M5.8 8.4h6.8a3.4 3.4 0 0 1 3.4 3.4v3.2a3.4 3.4 0 0 1-3.4 3.4H9.4L6.6 21v-2.6H5.8a3.4 3.4 0 0 1-3.4-3.4v-3.2a3.4 3.4 0 0 1 3.4-3.4z';

export const Chat = createIcon({
    name: 'chat',
    label: 'Сообщения',
    usage: 'Круглая кнопка поддержки в углу, пункт «Мои сообщения» в кабинете',
    shapes: [BUBBLE],
    marks: [circle(8, 11.6, 1.3), circle(12, 11.6, 1.3), circle(16, 11.6, 1.3)],
    alt: {
        3: {
            shapes: [rrect(10.4, 2.4, 11, 8, 3.4)],
            halo: [FRONT_BUBBLE],
            front: [FRONT_BUBBLE],
            marks: [circle(6.2, 13.6, 1), circle(9.2, 13.6, 1), circle(12.2, 13.6, 1)],
        },
    },
    labels: ['Заливка', 'Контур', 'Диалог'],
});

const TORSO = 'M3.8 21c0-4.4 3.6-7 8.2-7s8.2 2.6 8.2 7a1 1 0 0 1-1 1H4.8a1 1 0 0 1-1-1z';

export const User = createIcon({
    name: 'user',
    label: 'Пользователь',
    usage: 'Заглушка аватара в окне смены фото профиля',
    shapes: [circle(12, 7.6, 4.2), TORSO],
});

export const UserCircle = createIcon({
    name: 'userCircle',
    label: 'Аватар',
    usage: 'Аватар в шапке, когда у пользователя нет фото',
    shapes: [circle(12, 12, 9.4)],
    marks: [circle(12, 9.4, 3.1), 'M5.7 18.2c.9-2.6 3.5-4.2 6.3-4.2s5.4 1.6 6.3 4.2a9.4 9.4 0 0 1-12.6 0z'],
});

const BACK_BODY = 'M10.6 21.6c0-4.2 2.4-7.4 6-7.4s5.8 3 5.8 6.4c0 .6-.4 1-1 1z';
const FRONT_BODY = 'M2.4 20.6c0-3.8 2.8-6.2 6.4-6.2s6.4 2.4 6.4 6.2a1 1 0 0 1-1 1H3.4a1 1 0 0 1-1-1z';

export const Users = createIcon({
    name: 'users',
    label: 'Пользователи',
    usage: 'Админка: «Управление пользователями»',
    shapes: [circle(16.6, 7.4, 2.9), BACK_BODY],
    halo: [circle(8.8, 8.2, 3.6), FRONT_BODY],
    front: [circle(8.8, 8.2, 3.4), FRONT_BODY],
});

const SHIELD = 'M12 2.4 4.4 5.2v6c0 4.9 3.2 8.6 7.6 10.4 4.4-1.8 7.6-5.5 7.6-10.4v-6z';

export const Shield = createIcon({
    name: 'shield',
    label: 'Щит',
    usage: 'Админка: «Модерация объектов»',
    shapes: [SHIELD],
    strokes: ['M8.4 11.8l2.6 2.6 4.8-5.2'],
    cut: 2.2,
    alt: { 3: { shapes: [SHIELD], marks: [star5(12, 11.8, 4.6, 2)] } },
    labels: ['Заливка', 'Контур', 'Со звездой'],
});

const EYE = 'M1.8 12C4.4 7.4 8 5.2 12 5.2s7.6 2.2 10.2 6.8c-2.6 4.6-6.2 6.8-10.2 6.8S4.4 16.6 1.8 12z';

export const Eye = createIcon({
    name: 'eye',
    label: 'Просмотры',
    usage: 'Счётчик просмотров в статистике объекта',
    shapes: [EYE],
    holes: [circle(12, 12, 3)],
});

export const BarChart = createIcon({
    name: 'barChart',
    label: 'Статистика',
    usage: 'Статистика: мои объекты и общая статистика сайта',
    shapes: [rrect(3.6, 12.4, 4.4, 8.6, 1.2), rrect(9.8, 3.6, 4.4, 17.4, 1.2), rrect(16, 8.4, 4.4, 12.6, 1.2)],
    alt: {
        3: {
            shapes: [rrect(3.6, 12.4, 4.4, 8.6, 1.2), rrect(9.8, 6.4, 4.4, 14.6, 1.2), rrect(16, 9.4, 4.4, 11.6, 1.2)],
            extras: `<path d="M3.6 8 9.6 3.8l4 2.4L20.4 2" stroke="$fg" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
        },
    },
    labels: ['Заливка', 'Контур', 'С трендом'],
});

const CAM =
    'M3 9.2A3.2 3.2 0 0 1 6.2 6h1.4l1-1.8c.3-.6.9-.9 1.5-.9h3.8c.6 0 1.2.3 1.5.9l1 1.8h1.4A3.2 3.2 0 0 1 21 9.2v8.6a3.2 3.2 0 0 1-3.2 3.2H6.2A3.2 3.2 0 0 1 3 17.8z';

export const Camera = createIcon({
    name: 'camera',
    label: 'Камера',
    usage: 'Загрузка фотографий: форма добавления и редактирования квартиры',
    shapes: [CAM],
    holes: [circle(12, 13.4, 3.8)],
    alt: {
        3: {
            shapes: [CAM],
            holes: [circle(12, 13.4, 3.8)],
            extras: `<path d="${spark(20.6, 3.2, 2.6)}" fill="$fg"/>`,
        },
    },
    labels: ['Заливка', 'Контур', 'Со вспышкой'],
});
