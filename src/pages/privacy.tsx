// ============================================================
// /privacy — Политика в отношении обработки персональных данных
// ============================================================
// Сам текст — в src/lib/legal/privacy.tsx (данные), вёрстка — в
// src/components/legal/LegalDocument.tsx. Страница остаётся тонкой:
// подключила документ и всё.

import { LegalDocument } from '@/components/legal/LegalDocument';
import { PRIVACY } from '@/lib/legal/privacy';

export default function PrivacyPage() {
    return <LegalDocument doc={PRIVACY} />;
}
