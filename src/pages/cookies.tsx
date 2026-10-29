// ============================================================
// /cookies — Политика использования cookie
// ============================================================
// Внизу документа — кнопка «Настроить cookie»: пользователь может
// изменить категории согласия в любой момент (отзыв/изменение
// согласия не сложнее его дачи — требование закона).

import { CookieSettingsButton } from '@/components/consent/CookieSettingsButton';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { COOKIES_POLICY } from '@/lib/legal/cookies';

export default function CookiesPage() {
    return (
        <LegalDocument
            doc={COOKIES_POLICY}
            footer={<CookieSettingsButton />}
        />
    );
}
