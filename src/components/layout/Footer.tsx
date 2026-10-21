import { FaInstagram, FaTelegramPlane } from 'react-icons/fa';

import Image from 'next/image';
import Link from 'next/link';

// Ссылки на соцсети. Подставь реальные профили, когда будут готовы.
const SOCIALS = [
    {
        href: 'https://t.me/radius_booking_bot',
        label: 'Telegram',
        icon: <FaTelegramPlane className="h-5 w-5" />,
    },
    {
        href: 'https://www.instagram.com/',
        label: 'Instagram',
        icon: <FaInstagram className="h-5 w-5" />,
    },
] as const;

export function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer>
            {/* Верхняя часть — колонки с ссылками */}
            <div className="mx-auto max-w-6xl px-5 py-12">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                    {/* Бренд + описание + соцсети */}
                    <div className="col-span-2 md:col-span-1">
                        <Link
                            href="/"
                            className="text-xl font-bold text-foreground no-underline"
                        >
                            Radius
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

                    {/* Разделы */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Разделы</h3>
                        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <li>
                                <Link
                                    href="/"
                                    className="hover:text-primary"
                                >
                                    Главная
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/profile/favorites"
                                    className="hover:text-primary"
                                >
                                    Избранное
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/admin/add-apartment"
                                    className="hover:text-primary"
                                >
                                    Сдать квартиру
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Арендаторам */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Арендаторам</h3>
                        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <li>
                                <Link
                                    href="/profile/bookings"
                                    className="hover:text-primary"
                                >
                                    Мои бронирования
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/profile/chat"
                                    className="hover:text-primary"
                                >
                                    Сообщения
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/my-apartments"
                                    className="hover:text-primary"
                                >
                                    Мои объекты
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Компания */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground">Компания</h3>
                        <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <li>
                                <Link
                                    href="/privacy"
                                    className="hover:text-primary"
                                >
                                    Политика конфиденциальности
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className="hover:text-primary"
                                >
                                    Условия использования
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Нижняя часть — копирайт + платёжный сервис */}
            <div>
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-4 text-sm text-muted-foreground md:flex-row">
                    <span>© {year} radius-stay.by — аренда жилья посуточно</span>
                    <a
                        href="https://express-pay.by"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Платёжный сервис «Экспресс Платежи»"
                        className="group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors hover:bg-muted"
                    >
                        <Image
                            src="https://express-pay.by/brandbook/logo.png"
                            alt="Экспресс Платежи"
                            title="Экспресс Платежи"
                            width={72}
                            height={28}
                            className="h-auto w-auto rounded bg-white p-1"
                        />
                        <span className="text-[11px] whitespace-nowrap text-muted-foreground transition-colors group-hover:text-foreground">
                            онлайн-оплата
                        </span>
                    </a>
                </div>
            </div>
        </footer>
    );
}
