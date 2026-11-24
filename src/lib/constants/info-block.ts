import { Home, type IconComponent, Important, Info, Mail, Note, Route, Sparkles } from '@/components/icons';

// ============================================================
// ИКОНКИ БЛОКОВ РАЗДЕЛА «ИНФОРМАЦИЯ» — ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ
//
// В БД иконка хранится СТРОКОЙ ('home', 'route'...), а на экране нужен
// компонент (Home, Route...). Этот файл — мост между строкой и компонентом.
// Используют: InfoTab (показ на странице) и админка (выбор в форме).
// ============================================================

/** Иконка для выпадающего списка в админке: строка + подпись + компонент. */
export const INFO_BLOCK_ICON_OPTIONS: { value: string; label: string; icon: IconComponent }[] = [
    { value: 'home', label: 'Дом', icon: Home },
    { value: 'route', label: 'Маршрут', icon: Route },
    { value: 'info', label: 'Информация', icon: Info },
    { value: 'important', label: 'Важная информация', icon: Important },
    { value: 'note', label: 'Заметка', icon: Note },
    { value: 'mail', label: 'Почта', icon: Mail },
    { value: 'sparkles', label: 'Искры', icon: Sparkles },
];

/**
 * Словарь «строка из БД → компонент иконки».
 * По строке 'home' достаём компонент Home. Неизвестная строка (мусор в БД)
 * → Info как безопасное значение по умолчанию, а не краш.
 */
export const INFO_BLOCK_ICONS: Record<string, IconComponent> = Object.fromEntries(
    INFO_BLOCK_ICON_OPTIONS.map((opt) => [opt.value, opt.icon]),
);

/** Достать компонент иконки по строке из БД (мусор → Info). */
export function getInfoBlockIcon(value: string): IconComponent {
    return INFO_BLOCK_ICONS[value] ?? Info;
}
