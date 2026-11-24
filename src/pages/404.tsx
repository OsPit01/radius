import Link from 'next/link';

import { Layout } from '@/shared/ui/layout';

// ============================================================
// Кастомная страница 404.
//
// Next.js рендерит её на ЛЮБОЙ notFound — и на несуществующий URL,
// и на закрытую страницу (гарды requireRole/requireCan отдают 404,
// чтобы не выдавать факт существования закрытых разделов).
// Красивый вид вместо скучной дефолтной ошибки.
// ============================================================
export default function NotFoundPage() {
    return (
        <Layout withFooter>
            <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center max-md:py-10">
                <p className="text-6xl font-bold text-primary max-md:text-5xl">404</p>
                <h1 className="mt-4 text-2xl font-bold text-foreground max-md:text-xl">Страница не найдена</h1>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    Такой страницы нет или она недоступна по вашему адресу. Проверьте ссылку или вернитесь на главную.
                </p>
                <Link
                    href="/"
                    className="mt-8 inline-flex min-h-11 items-center justify-center rounded-[30px] bg-foreground px-6 py-3 text-sm font-medium text-background no-underline transition-colors hover:bg-foreground/85"
                >
                    На главную
                </Link>
            </div>
        </Layout>
    );
}
