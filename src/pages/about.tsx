// ============================================================
// /about — О компании
// ============================================================
//
// Текст о платформе. Реквизиты читаются из БД на сервере
// (fallback — OPERATOR из кода).

import type { GetServerSideProps } from 'next';
import Link from 'next/link';

import { Seo } from '@/components/Seo';
import { ADD_APARTMENT_URL } from '@/lib/legal/operator';
import { type SiteRequisites, toSiteRequisites } from '@/lib/legal/requisites';
import { Layout } from '@/shared/ui/layout';
import { createServerCaller } from '@/trpc/server';

type AboutPageProps = {
    requisites: SiteRequisites;
};

export const getServerSideProps: GetServerSideProps<AboutPageProps> = async (ctx) => {
    const caller = await createServerCaller(ctx);
    const row = await caller.requisites.get();
    return {
        props: {
            requisites: toSiteRequisites(row),
        },
    };
};

export default function AboutPage({ requisites }: AboutPageProps) {
    const req = requisites;
    const DESCRIPTION = `${req.siteName} — платформа посуточной аренды жилья в Беларуси: собственники размещают объекты бесплатно, гости бронируют напрямую, без посредников.`;

    return (
        <>
            <Seo
                title="О компании"
                description={DESCRIPTION}
                canonical="/about"
            />
            <Layout withFooter>
                <div className="rounded-2xl bg-card p-8 shadow-sm max-md:p-5">
                    <h1 className="mb-6 text-3xl font-bold max-md:text-2xl">О {req.siteName}</h1>

                    <div className="space-y-4 text-base leading-relaxed">
                        <p>
                            <strong>{req.siteName}</strong> — это белорусская платформа посуточной аренды жилья. Мы
                            соединяем тех, у кого есть квартира или дом, и тех, кому нужно жильё на сутки — напрямую,
                            без посредников и переплат.
                        </p>
                        <p>
                            Мы верим, что снять жильё на сутки должно быть так же просто, как вызвать такси: нашёл,
                            посмотрел реальные фото, написал владельцу — и поехал. Никаких «менеджер перезвонит»,
                            никаких скрытых комиссий.
                        </p>
                        <p>
                            Размещение объектов и поиск жилья на платформе — <strong>бесплатны</strong>. Мы не берём
                            комиссию ни с собственников, ни с гостей: платформа растёт вместе с сообществом, а не за
                            счёт него.
                        </p>
                        <p>
                            Каждое объявление проходит модерацию: мы следим за достоверностью фото, точностью цен и
                            адекватностью описаний — чтобы поиск не превращался в лотерею.
                        </p>
                        <p>
                            Мы начинали с Минска и ближайших окрестностей — и растём по всей Беларуси. Впереди: больше
                            городов, отзывы гостей, ещё более удобные бронирования.
                        </p>
                    </div>

                    {/* Действия: два главных сценария — снять или сдать */}
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/rent/flat/minsk"
                            className="flex min-h-11 flex-1 items-center justify-center rounded-[30px] bg-foreground px-6 py-3 text-sm font-medium text-background no-underline transition-colors hover:bg-foreground/85"
                        >
                            Найти квартиру
                        </Link>
                        <Link
                            href={ADD_APARTMENT_URL}
                            className="flex min-h-11 flex-1 items-center justify-center rounded-[30px] border border-border px-6 py-3 text-sm font-medium text-foreground no-underline transition-colors hover:border-primary hover:text-primary"
                        >
                            Сдать квартиру
                        </Link>
                    </div>

                    {/* Реквизиты и контакты — рядом, чтобы не искать */}
                    <p className="mt-8 border-t border-border pt-4 text-sm text-muted-foreground">
                        {req.legalName}, УНП {req.unp}. Подробные реквизиты и контакты — на странице{' '}
                        <Link
                            href="/contacts"
                            className="text-primary underline hover:text-primary/80"
                        >
                            «Контакты и реквизиты»
                        </Link>
                        .
                    </p>
                </div>
            </Layout>
        </>
    );
}
