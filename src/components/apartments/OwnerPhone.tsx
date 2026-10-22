import Link from 'next/link';

import { Phone } from '@/components/icons';
import { formatPhoneForDisplay } from '@/lib/phone';

type OwnerPhoneProps = {
    /** Телефон владельца. null, если посетитель не авторизован. */
    phone: string | null;
    /** true — посетитель вошёл в аккаунт. */
    canViewPhone: boolean;
};

const BASE_CLASS =
    'mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center text-sm font-medium transition-colors';

/**
 * Контактный телефон владельца.
 *
 * Важно: номер телефона приходит сюда уже скрытым от сервера,
 * поэтому анонимный посетитель не может его увидеть ни в интерфейсе,
 * ни в исходном коде страницы.
 */
export function OwnerPhone({ phone, canViewPhone }: OwnerPhoneProps) {
    // 1. Гость вошёл и телефон есть — показываем кликабельный номер.
    if (canViewPhone && phone) {
        return (
            <a
                href={`tel:${phone}`}
                className={`${BASE_CLASS} bg-foreground text-background hover:bg-foreground/85`}
            >
                <Phone className="h-5 w-5" />
                {formatPhoneForDisplay(phone)}
            </a>
        );
    }

    // 2. Гость вошёл, но владелец не оставил телефон — это не вина гостя,
    //    поэтому предлагаем другой способ связи, а не просьбу войти.
    if (canViewPhone) {
        return (
            <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
                Владелец не указал номер телефона
            </p>
        );
    }

    // 3. Анонимный посетитель: номер скрыт на уровне сервера.
    return (
        <Link
            href="/auth/signin"
            className={`${BASE_CLASS} border border-border bg-card text-foreground hover:border-primary hover:text-primary`}
        >
            <Phone className="h-5 w-5" />
            Войдите, чтобы увидеть номер
        </Link>
    );
}
