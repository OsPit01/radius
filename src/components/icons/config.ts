/**
 * Какой из трёх вариантов иконки показывать по умолчанию. Все иконки одноцветные —
 * берут цвет текста (currentColor), а варианты различаются только начертанием.
 *
 * Сравнить варианты можно на странице /profile/icons (видна только суперадмину: профиль → «Все иконки на проекте»).
 * Понравился другой — поменяйте цифру здесь, и он заменится по всему сайту.
 * Точечно вариант можно задать и в месте использования: <Heart variant={3} />.
 */
export type IconVariant = 1 | 2 | 3;

export const ICON_NAMES = [
    // навигация
    'arrowLeft',
    'arrowRight',
    'chevronLeft',
    'chevronRight',
    'chevronDown',
    // действия
    'close',
    'menu',
    'plus',
    'minus',
    'check',
    'search',
    'filters',
    'maximize',
    'send',
    'settings',
    // статусы
    'checkCircle',
    'warning',
    'info',
    'hourglass',
    'star',
    'heart',
    'bell',
    // жильё
    'home',
    'building',
    'bed',
    'sofa',
    'bath',
    'ruler',
    'car',
    'metro',
    'mapPin',
    'mapView',
    'sparkles',
    // справка
    'money',
    'note',
    'clipboard',
    'clock',
    'alarmClock',
    'calendar',
    'phone',
    // люди и разделы
    'chat',
    'user',
    'userCircle',
    'users',
    'shield',
    'eye',
    'barChart',
    'camera',
    // бренды
    'telegram',
    'instagram',
    'google',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const ICON_VARIANTS: Record<IconName, IconVariant> = {
    // 1 — заливка, 2 — контур, 3 — дуотон. У стрелок, крестика и т.п.: 1 — штрих, 2 — в кольце, 3 — плашка.
    // Сердце и звезда: заливка = «выбрано», а «не выбрано» рисуется контуром (проп muted).
    arrowLeft: 1,
    arrowRight: 1,
    chevronLeft: 1,
    chevronRight: 1,
    chevronDown: 1,
    close: 1,
    menu: 1,
    plus: 1,
    minus: 1,
    check: 1,
    search: 2,
    filters: 2,
    maximize: 2,
    send: 2,
    settings: 2,
    checkCircle: 2,
    warning: 2,
    info: 2,
    hourglass: 2,
    star: 1,
    heart: 1,
    bell: 2,
    home: 2,
    building: 2,
    bed: 2,
    sofa: 2,
    bath: 2,
    ruler: 2,
    car: 2,
    metro: 2,
    mapPin: 2,
    mapView: 2,
    sparkles: 2,
    money: 2,
    note: 2,
    clipboard: 2,
    clock: 2,
    alarmClock: 2,
    calendar: 2,
    phone: 2,
    chat: 2,
    user: 2,
    userCircle: 2,
    users: 2,
    shield: 2,
    eye: 2,
    barChart: 2,
    camera: 2,
    telegram: 2,
    instagram: 2,
    google: 2,
};
