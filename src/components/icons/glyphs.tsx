import { createGlyphIcon } from './core';

// Простые «штриховые» иконки: стрелки, шевроны, крестик, плюс, минус, галочка, бургер.
// Три варианта у каждой строятся автоматически: голый штрих, глиф в кольце, глиф в круглой плашке.

export const ArrowLeft = createGlyphIcon({
    name: 'arrowLeft',
    label: 'Стрелка влево',
    usage: 'Шапка чата («назад к списку»), кнопка «← Назад» в мастере добавления квартиры, фото-галерея',
    d: 'M19 12H5M11 5.8 4.8 12 11 18.2',
});

export const ArrowRight = createGlyphIcon({
    name: 'arrowRight',
    label: 'Стрелка вправо',
    usage: 'Кнопка «Далее →», пункты меню профиля, «Открыть объект», фото-галерея',
    d: 'M5 12h14M13 5.8l6.2 6.2L13 18.2',
});

export const ChevronLeft = createGlyphIcon({
    name: 'chevronLeft',
    label: 'Шеврон влево',
    usage: 'Пагинация списка квартир — «предыдущая страница»',
    d: 'M14.5 5.5 8 12l6.5 6.5',
    w: 3.4,
});

export const ChevronRight = createGlyphIcon({
    name: 'chevronRight',
    label: 'Шеврон вправо',
    usage: 'Пагинация списка квартир — «следующая страница»',
    d: 'M9.5 5.5 16 12l-6.5 6.5',
    w: 3.4,
});

export const ChevronDown = createGlyphIcon({
    name: 'chevronDown',
    label: 'Шеврон вниз',
    usage: 'Выпадающие списки: «кто едет?» в поиске, выбор значения в форме квартиры',
    d: 'M5.5 9.5 12 16l6.5-6.5',
    w: 3.4,
});

export const Close = createGlyphIcon({
    name: 'close',
    label: 'Закрыть',
    usage: 'Закрытие модалок, мобильное меню, сброс фильтров-чипов, удаление фото',
    d: 'M6.2 6.2l11.6 11.6M17.8 6.2 6.2 17.8',
});

export const Menu = createGlyphIcon({
    name: 'menu',
    label: 'Меню',
    usage: 'Бургер мобильной шапки',
    d: 'M4.5 7h15M4.5 12h15M4.5 17h15',
});

export const Plus = createGlyphIcon({
    name: 'plus',
    label: 'Плюс',
    usage: 'Степперы гостей, «Добавить квартиру», плитка загрузки фото',
    d: 'M12 4.8v14.4M4.8 12h14.4',
});

export const Minus = createGlyphIcon({
    name: 'minus',
    label: 'Минус',
    usage: 'Степперы гостей в поиске и в форме бронирования',
    d: 'M4.8 12h14.4',
});

export const Check = createGlyphIcon({
    name: 'check',
    label: 'Галочка',
    usage: 'Список удобств квартиры',
    d: 'M5 12.6l4.7 4.7L19 7.2',
});
