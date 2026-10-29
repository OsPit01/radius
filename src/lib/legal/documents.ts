// ============================================================
// src/lib/legal/documents.ts — РЕЕСТР ЮРИДИЧЕСКИХ ДОКУМЕНТОВ
// ============================================================
//
// Единый список документов «в одном месте». Отсюда берут:
// - футер (колонка «Документы»);
// - sitemap.xml (какие страницы добавить в карту сайта).
//
// Порядок массива = порядок ссылок в футере.
// Тексты лежат в отдельных файлах рядом — правка одного
// документа не затрагивает остальные.
// ============================================================

import { CONSENT } from '@/lib/legal/consent';
import { COOKIES_POLICY } from '@/lib/legal/cookies';
import { PRIVACY } from '@/lib/legal/privacy';
import { TERMS } from '@/lib/legal/terms';
import type { LegalDocumentData } from '@/lib/legal/types';

export const LEGAL_DOCUMENTS: readonly LegalDocumentData[] = [PRIVACY, COOKIES_POLICY, TERMS, CONSENT];
