// ============================================================
// /contacts — Контакты и реквизиты платформы
// ============================================================
//
// Все данные берутся из ЕДИНОГО источника — src/lib/legal/operator.ts.
// Здесь ничего не хардкодится: поменяли реквизиты в одном файле —
// обновились футер, документы и эта страница.
//
// JSON-LD (Organization) — микроразметка для поисковиков: по
// брендовым запросам Google показывает адрес и почту компании.
// Это невидимая разметка, страницы не утяжеляет.
// ============================================================

import Head from 'next/head';

import { Mail, MapPin, Shield, Telegram } from '@/components/icons';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Seo } from '@/components/Seo';
import { OPERATOR } from '@/lib/legal/operator';
import { SITE_URL } from '@/lib/seo';

export default function ContactsPage() {
    return (
        <>
            <Seo
                title="Контакты и реквизиты"
                description={`Реквизиты и контакты ${OPERATOR.siteName}: арендодателям и гостям. Вопросы по персональным данным — ${OPERATOR.privacyEmail}.`}
                canonical="/contacts"
            />

            {/* Микроразметка организации: name, адрес, почта, УНП. */}
            <Head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'Organization',
                            name: OPERATOR.siteName,
                            url: SITE_URL,
                            email: OPERATOR.supportEmail,
                            taxID: OPERATOR.unp,
                            address: {
                                '@type': 'PostalAddress',
                                streetAddress: 'улица Леонардо Да Винчи, 2',
                                addressLocality: 'д. Копище',
                                addressCountry: 'BY',
                            },
                        }),
                    }}
                />
            </Head>

            <ClientHeader />

            <main className="mx-auto w-full max-w-3xl px-5 py-10 text-foreground max-md:px-4 max-md:py-6">
                <h1 className="mb-3 text-3xl font-bold max-md:text-2xl">Контакты и реквизиты</h1>
                <p className="mb-8 text-muted-foreground">
                    Мы на связи: поддержка отвечает на вопросы по сайту, бронированиям и размещению объектов.
                </p>

                <div className="flex flex-col gap-5">
                    {/* ===== Оператор платформы ===== */}
                    <section className="rounded-2xl bg-card p-6 shadow-sm max-md:p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-primary">
                                <MapPin className="h-6 w-6" />
                            </span>
                            <h2 className="text-lg font-semibold">Оператор платформы</h2>
                        </div>
                        <dl className="space-y-2 text-[15px]">
                            <Row
                                label="Наименование"
                                value={OPERATOR.legalName}
                            />
                            <Row
                                label="УНП"
                                value={OPERATOR.unp}
                            />
                            <Row
                                label="Юридический адрес"
                                value={OPERATOR.legalAddress}
                            />
                        </dl>
                    </section>

                    {/* ===== Поддержка ===== */}
                    <section className="rounded-2xl bg-card p-6 shadow-sm max-md:p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-primary">
                                <Telegram className="h-6 w-6" />
                            </span>
                            <h2 className="text-lg font-semibold">Поддержка</h2>
                        </div>
                        <div className="flex flex-col gap-3">
                            <a
                                href={`mailto:${OPERATOR.supportEmail}`}
                                className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
                            >
                                <Mail className="h-5 w-5 shrink-0" />
                                <span className="break-all">{OPERATOR.supportEmail}</span>
                            </a>
                            <a
                                href={OPERATOR.supportTelegramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
                            >
                                <Telegram className="h-5 w-5 shrink-0" />
                                <span>{OPERATOR.supportTelegram}</span>
                            </a>
                        </div>
                    </section>

                    {/* ===== Персональные данные ===== */}
                    <section className="rounded-2xl bg-card p-6 shadow-sm max-md:p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-primary">
                                <Shield className="h-6 w-6" />
                            </span>
                            <h2 className="text-lg font-semibold">Персональные данные</h2>
                        </div>
                        <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
                            Вопросы, связанные с обработкой персональных данных: получение информации, изменение,
                            удаление, отзыв согласия. Ответ на запрос — до 5 рабочих дней.
                        </p>
                        <a
                            href={`mailto:${OPERATOR.privacyEmail}`}
                            className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-primary hover:text-primary"
                        >
                            <Mail className="h-5 w-5 shrink-0" />
                            <span className="break-all">{OPERATOR.privacyEmail}</span>
                        </a>
                    </section>
                </div>
            </main>
        </>
    );
}

/** Строка «реквизит: значение» — определение описания (dl). */
function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
            <dt className="shrink-0 text-muted-foreground sm:w-44">{label}</dt>
            <dd className="font-medium break-words">{value}</dd>
        </div>
    );
}
