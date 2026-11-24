import Link from 'next/link';

import { Instagram, Telegram } from '@/components/icons';
import { LEGAL_DOCUMENTS } from '@/lib/legal/documents';
import { ADD_APARTMENT_URL } from '@/lib/legal/operator';
import { toSiteRequisites } from '@/lib/legal/requisites';
import { api } from '@/trpc/react';

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

const SERVICE_LINKS = [
    { href: '/', label: 'Главная' },
    { href: '/rent/flat/minsk', label: 'Квартиры в Минске' },
    { href: '/faq', label: 'Вопросы и ответы' },
] as const;

const LANDLORD_LINKS = [
    { href: ADD_APARTMENT_URL, label: 'Сдать квартиру' },
    { href: '/my-apartments', label: 'Мои объекты' },
    { href: '/terms#landlord', label: 'Правила размещения' },
] as const;

const COMPANY_LINKS = [
    { href: '/about', label: 'О компании' },
    { href: '/contacts', label: 'Контакты и реквизиты' },
] as const;

const FOOTER_LINK =
    'flex min-h-11 items-center text-sm text-muted-foreground no-underline transition-colors hover:text-primary';

const COLUMN_TITLE = 'mb-3 text-sm font-semibold text-foreground';

const year = new Date().getFullYear();

export function Footer() {
    // Реквизиты из БД; если строки нет — значения по умолчанию (OPERATOR).
    const { data } = api.requisites.get.useQuery();
    const req = toSiteRequisites(data);

    return (
        <footer className="border-t border-border">
            <div className="mx-auto max-w-7xl px-4 py-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                    <div className="col-span-2 md:col-span-4 lg:col-span-1">
                        <Link
                            href="/"
                            className="text-xl font-bold text-foreground no-underline"
                        >
                            {req.siteName}
                        </Link>
                        <h3 className="mt-3 text-sm font-semibold text-muted-foreground">
                            Посуточная аренда квартир напрямую от собственников. Без посредников и переплат.
                        </h3>
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

            <div className="border-t border-border">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground">
                    <p>
                        © {year} {req.siteName}
                    </p>
                    <p className="break-words">
                        {req.legalName} · УНП {req.unp}
                    </p>
                    <p className="break-words">Юридический адрес: {req.legalAddress}</p>
                    <p className="flex flex-wrap gap-1">
                        <a
                            href={`mailto:${req.footerEmails.privacy}`}
                            className="underline transition-colors hover:text-primary"
                        >
                            {req.footerEmails.privacy}
                        </a>
                        {' / '}
                        <a
                            href={`mailto:${req.footerEmails.support}`}
                            className="underline transition-colors hover:text-primary"
                        >
                            {req.footerEmails.support}
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
