import Link from 'next/link';

import { ArrowRight, type IconComponent } from '@/components/icons';
import { cn } from '@/shared/lib/utils';

type TileLinkProps = {
    /** Куда ведёт плитка. */
    href: string;
    /** Название раздела — оно же доступное имя ссылки (иконка декоративная, скринридер её не читает). */
    label: string;
    /** Иконка раздела. Необязательна: бывают плитки без иконки (например, «Все иконки на проекте»). */
    icon?: IconComponent;
    /** Счётчик справа (например, «мои объекты: 3»). Если не передан — рисуем стрелку. */
    count?: number;
    /** Дополнительные классы снаружи (например, отступ mt-6) — вклеиваются к базовым через cn. */
    className?: string;
};

/**
 * Плитка-ссылка дашборда — ЕДИНЫЙ стиль для личного кабинета (/profile) и панели
 * управления (/admin). Весь внешний вид живёт только в этом файле: поменять стиль
 * везде сразу = одна правка здесь, страницы трогать не нужно.
 *
 * Стиль — гибрид двух прежних версий: рамка и скругление как было в админке
 * (карточка чётко читается и в светлой, и в тёмной теме), а primary-иконка
 * и лёгкий hover-подъём — как в новых плитках профиля.
 */
export function TileLink({ href, label, icon, count, className }: TileLinkProps) {
    // Иконка пришла опционально — локальная переменная с заглавной буквы,
    // чтобы JSX мог использовать её как компонент: <Icon /> (имя с маленькой
    // буквы React считает HTML-тегом).
    const Icon = icon;

    return (
        <Link
            href={href}
            className={cn(
                'group flex cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 font-medium text-foreground no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-primary',
                className,
            )}
        >
            {Icon && <Icon className="h-8 w-8 shrink-0 text-primary" />}
            {/* min-w-0 + break-words: длинное название («Управление пользователями»)
                переносится, а не растягивает плитку за край экрана на мобилке */}
            <span className="min-w-0 break-words">{label}</span>
            {count !== undefined ? (
                // Счётчик: градиентная цифра справа (стиль из плиток профиля).
                // Проверка именно на undefined, а не на «ложность»: 0 — валидный
                // счётчик («у тебя 0 объектов») и должен показываться.
                <span className="ml-auto shrink-0 bg-[linear-gradient(135deg,var(--foreground),var(--primary))] bg-clip-text text-lg font-extrabold whitespace-nowrap text-transparent">
                    {count}
                </span>
            ) : (
                // Нет счётчика — рисуем стрелку (стиль из карточек админки):
                // подсказка «сюда можно перейти», при наведении сдвигается вправо
                <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
            )}
        </Link>
    );
}
