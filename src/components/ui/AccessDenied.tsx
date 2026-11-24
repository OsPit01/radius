import Link from 'next/link';

import { Shield } from '@/components/icons';

// ============================================================
// КРАСИВЫЙ ЭКРАН «НЕТ ДОСТУПА»
//
// Показывается вместо некрасивой 404, когда пользователь авторизован,
// но у него не хватает прав на страницу/действие. Единый вид на всех
// закрытых страницах — чтобы отказ выглядел аккуратно, а не как сбой.
// ============================================================
type AccessDeniedProps = {
    /** Заголовок (по умолчанию «Нет доступа»). */
    title?: string;
    /** Пояснение, почему отказано. */
    description?: string;
};

export function AccessDenied({
    title = 'Нет доступа',
    description = 'У вашей учётной записи недостаточно прав для просмотра этой страницы.',
}: AccessDeniedProps) {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center max-md:py-10">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Shield className="h-8 w-8" />
            </span>
            <h1 className="mt-6 text-2xl font-bold text-foreground max-md:text-xl">{title}</h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
            <Link
                href="/"
                className="mt-8 inline-flex min-h-11 items-center justify-center rounded-[30px] bg-foreground px-6 py-3 text-sm font-medium text-background no-underline transition-colors hover:bg-foreground/85"
            >
                На главную
            </Link>
        </div>
    );
}
