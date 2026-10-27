// ============================================================
// /consent — Согласие на обработку персональных данных
// ============================================================
// Это текст, на который ссылаются галочки в формах (вход, бронирование,
// размещение объекта). Закрыт от индексации: для поиска основной
// страницей о данных является /privacy.

import { LegalDocument } from '@/components/legal/LegalDocument';
import { CONSENT } from '@/lib/legal/consent';

export default function ConsentPage() {
    return <LegalDocument doc={CONSENT} />;
}
