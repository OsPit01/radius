// ============================================================
// src/components/layout/Footer.tsx — ФУТЕР САЙТА
// ============================================================
//
// Структура (по образцу крупных площадок недвижимости):
//   Бренд+соцсети | Сервис | Арендодателям | Компания | Документы
//   Низ: ©, реквизиты оператора, почта, ссылка на «Контакты».
//
// Откуда берутся данные:
// - реквизиты и почта — из src/lib/legal/operator.ts (один источник);
// - список документов — из src/lib/legal/documents.ts (один источник);
// добавить/убрать документ = изменить один массив, футер подтянется сам.
//
// Мобильная версия (mobile-first):
// - бренд занимает всю ширину, группы ссылок — сетка 2×2;
// - ссылки min-h-11 (44px) — удобно попадать пальцем;
// - нижний блок переносится по строкам, ничего не вылезает на 360px.
// ============================================================

import Link from 'next/link';

import { Instagram, Telegram } from '@/components/icons';
import { LEGAL_DOCUMENTS } from '@/lib/legal/documents';
import { ADD_APARTMENT_URL, OPERATOR } from '@/lib/legal/operator';

// Ссылки на соцсети. Подставь реальные профили, когда будут готовы.
const SOCIALS = [
    {
        href: 'https://t.me/FlatOfMinsk',
        label: 'Telegram',
        icon: <Telegram className="h-5 w-5" />,
    },
    {
        href: 'https://www.instagram.com/naradare.by',
        label: 'Instagram',
        icon: <Instagram className="h-5 w-5" />,
    },
] as const;

// ===== Раздел «Сервис» — главные сценарии гостя =====
const SERVICE_LINKS = [
    { href: '/', label: 'Главная' },
    { href: '/rent/flat/minsk', label: 'Квартиры в Минске' },
    { href: '/faq', label: 'Вопросы и ответы' },
] as const;

// ===== Раздел «Арендодателям» — всё про размещение объекта =====
const LANDLORD_LINKS = [
    { href: ADD_APARTMENT_URL, label: 'Сдать квартиру' },
    { href: '/my-apartments', label: 'Мои объекты' },
    { href: '/terms#landlord', label: 'Правила размещения' },
] as const;

// ===== Раздел «Компания» =====
const COMPANY_LINKS = [
    { href: '/about', label: 'О компании' },
    { href: '/contacts', label: 'Контакты и реквизиты' },
] as const;

// Общий стиль ссылки: строка 44px+ — тапабельно на телефоне.
const FOOTER_LINK =
    'flex min-h-11 items-center text-sm text-muted-foreground no-underline transition-colors hover:text-primary';

// Заголовок колонки.
const COLUMN_TITLE = 'mb-3 text-sm font-semibold text-foreground';

export function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-background">
            {/* ===== Верх: колонки с ссылками ===== */}
            <div className="mx-auto max-w-6xl px-5 py-12 max-md:px-4 max-md:py-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                    {/* Бренд + описание + соцсети */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-1">
                        <Link
                            href="/"
                            className="text-xl font-bold text-foreground no-underline"
                        >
                            {OPERATOR.siteName}
                        </Link>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            Посуточная аренда квартир напрямую от собственников. Без посредников и переплат.
                        </p>
                        <div className="mt-4 flex gap-3">
                            {SOCIALS.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.label}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Сервис */}
                    <nav aria-label="Сервис">
                        <h3 className={COLUMN_TITLE}>Сервис</h3>
                        <ul className="flex flex-col">
                            {SERVICE_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={FOOTER_LINK}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Арендодателям */}
                    <nav aria-label="Арендодателям">
                        <h3 className={COLUMN_TITLE}>Арендодателям</h3>
                        <ul className="flex flex-col">
                            {LANDLORD_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={FOOTER_LINK}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Компания */}
                    <nav aria-label="Компания">
                        <h3 className={COLUMN_TITLE}>Компания</h3>
                        <ul className="flex flex-col">
                            {COMPANY_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className={FOOTER_LINK}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Документы — из единого реестра юридических документов */}
                    <nav aria-label="Документы">
                        <h3 className={COLUMN_TITLE}>Документы</h3>
                        <ul className="flex flex-col">
                            {LEGAL_DOCUMENTS.map((doc) => (
                                <li key={doc.slug}>
                                    <Link
                                        href={doc.slug}
                                        className={FOOTER_LINK}
                                    >
                                        {doc.navTitle}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </div>

            {/* ===== Низ: копирайт + реквизиты оператора ===== */}
            <div className="border-t border-border">
                <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-5 py-6 text-sm text-muted-foreground max-md:px-4">
                    <p>
                        © {year} {OPERATOR.siteName}
                    </p>
                    <p className="break-words">
                        {OPERATOR.legalName} · УНП {OPERATOR.unp}
                    </p>
                    <p className="break-words">Юридический адрес: {OPERATOR.legalAddress}</p>
                    <p className="break-all">
                        <a
                            href={`mailto:${OPERATOR.footerEmails.privacy}`}
                            className="underline transition-colors hover:text-primary"
                        >
                            {OPERATOR.footerEmails.privacy}
                        </a>
                        {' / '}
                        <a
                            href={`mailto:${OPERATOR.footerEmails.support}`}
                            className="underline transition-colors hover:text-primary"
                        >
                            {OPERATOR.footerEmails.support}
                        </a>
                    </p>
                    <p className="mt-2">
                        <Link
                            href="/contacts"
                            className="font-medium text-foreground underline transition-colors hover:text-primary"
                        >
                            Реквизиты и контакты
                        </Link>
                    </p>
                </div>
            </div>
        </footer>
    );
}
