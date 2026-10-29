// ============================================================
// /terms — Пользовательское соглашение
// ============================================================
// Текст — в src/lib/legal/terms.tsx, вёрстка — в LegalDocument.
// Раздел «Правила размещения объявлений» доступен по якорю
// /terms#landlord (на него ссылается футер).

import { LegalDocument } from '@/components/legal/LegalDocument';
import { TERMS } from '@/lib/legal/terms';

export default function TermsPage() {
    return <LegalDocument doc={TERMS} />;
}
