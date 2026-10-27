// ============================================================
// /faq — Вопросы и ответы
// ============================================================
//
// Каждая пара «вопрос-ответ» — нативный <details>: раскрывается без
// JavaScript, работает мгновенно на телефоне и доступна скринридерам.
// Ссылки на страницы — обычные Link.

import Link from 'next/link';

import { ChevronDown } from '@/components/icons';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Seo } from '@/components/Seo';
import { ADD_APARTMENT_URL, OPERATOR } from '@/lib/legal/operator';

type FaqItem = {
    question: string;
    answer: React.ReactNode;
};

const FAQ_ITEMS: FaqItem[] = [
    {
        question: 'Как забронировать квартиру на сутки?',
        answer: (
            <>
                Откройте страницу объекта, нажмите «Забронировать» и заполните заявку: даты, количество гостей и
                телефон. Заявка уходит владельцу — он подтверждает её или отклоняет. Статус виден в разделе «Мои
                бронирования».
            </>
        ),
    },
    {
        question: 'Сколько стоят ваши услуги?',
        answer: (
            <>
                Ноль рублей. Размещение объектов и поиск жилья на {OPERATOR.siteName} бесплатны для обеих сторон: мы не
                берём комиссию ни с собственников, ни с гостей.
            </>
        ),
    },
    {
        question: 'Почему я не вижу телефон владельца?',
        answer: (
            <>
                Телефон показывается только вошедшим в аккаунт пользователям — так мы защищаем владельцев от спама и
                автоматических звонков.{' '}
                <Link
                    href="/auth/signin"
                    className="text-primary underline hover:text-primary/80"
                >
                    Войдите
                </Link>{' '}
                — и номер появится на странице объекта.
            </>
        ),
    },
    {
        question: 'Как разместить свою квартиру?',
        answer: (
            <>
                Войдите в аккаунт и нажмите «Сдать квартиру»: мастер проведёт по шагам — тип объекта, адрес, описание,
                фото и цена. После отправки объявление проходит модерацию и публикуется.
            </>
        ),
    },
    {
        question: 'Моя заявка — это уже подтверждённая бронь?',
        answer: (
            <>
                Нет. Заявка — это запрос владельцу. Бронь считается согласованной только после подтверждения владельцем:
                следите за статусом в разделе «Мои бронирования» или в чате.
            </>
        ),
    },
    {
        question: 'Сайт принимает оплату за аренду?',
        answer: (
            <>
                Нет. Все расчёты — напрямую между гостем и владельцем. {OPERATOR.siteName} не берёт платежи и не
                гарантирует сделки. Будьте осторожны: не переводите предоплату незнакомым людям без подтверждения брони.
            </>
        ),
    },
    {
        question: 'Как удалить аккаунт или отозвать согласие на обработку данных?',
        answer: (
            <>
                Напишите на {OPERATOR.privacyEmail}: удалим учётную запись и данные, отзовём согласие на обработку
                персональных данных. Порядок и сроки описаны в{' '}
                <Link
                    href="/privacy"
                    className="text-primary underline hover:text-primary/80"
                >
                    Политике обработки персональных данных
                </Link>
                .
            </>
        ),
    },
];

export default function FaqPage() {
    return (
        <>
            <Seo
                title="Вопросы и ответы"
                description={`Частые вопросы о ${OPERATOR.siteName}: как забронировать квартиру на сутки, как разместить объект, почему скрыт телефон владельца, бесплатно ли это.`}
                canonical="/faq"
            />
            <ClientHeader />

            <main className="mx-auto w-full max-w-3xl px-5 py-10 text-foreground max-md:px-4 max-md:py-6">
                <h1 className="mb-3 text-3xl font-bold max-md:text-2xl">Вопросы и ответы</h1>
                <p className="mb-8 text-muted-foreground">
                    Коротко о том, как работает платформа. Не нашли ответ — напишите нам на{' '}
                    <a
                        href={`mailto:${OPERATOR.supportEmail}`}
                        className="text-primary underline hover:text-primary/80"
                    >
                        {OPERATOR.supportEmail}
                    </a>
                    .
                </p>

                <div className="flex flex-col gap-3">
                    {FAQ_ITEMS.map((item) => (
                        <details
                            key={item.question}
                            className="group rounded-2xl bg-card p-5 shadow-sm"
                        >
                            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium">
                                {item.question}
                                {/* Стрелка поворачивается при раскрытии (details open) */}
                                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                            </summary>
                            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{item.answer}</p>
                        </details>
                    ))}
                </div>

                {/* Ключевые сценарии — подсказка внизу */}
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
            </main>
        </>
    );
}
