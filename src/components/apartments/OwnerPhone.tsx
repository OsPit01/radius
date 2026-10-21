import Link from 'next/link';

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
                className={`${BASE_CLASS} bg-gray-800 text-white hover:bg-gray-700`}
            >
                <span>📞</span>
                {formatPhoneForDisplay(phone)}
            </a>
        );
    }

    // 2. Гость вошёл, но владелец не оставил телефон — это не вина гостя,
    //    поэтому предлагаем другой способ связи, а не просьбу войти.
    if (canViewPhone) {
        return (
            <p className="mt-3 rounded-xl bg-[#f7f7f8] px-4 py-3 text-center text-sm text-[#888]">
                Владелец не указал номер телефона
            </p>
        );
    }

    // 3. Анонимный посетитель: номер скрыт на уровне сервера.
    return (
        <Link
            href="/auth/signin"
            className={`${BASE_CLASS} border border-[#e0e0e0] bg-white text-[#222] hover:border-[#6b21a8] hover:text-[#6b21a8]`}
        >
            <span>📞</span>
            Войдите, чтобы увидеть номер
        </Link>
    );
}
