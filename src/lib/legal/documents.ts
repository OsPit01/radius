// ============================================================
// src/lib/legal/documents.ts — РЕЕСТР ЮРИДИЧЕСКИХ ДОКУМЕНТОВ
// ============================================================
//
// Единый список документов «в одном месте». Отсюда берут:
// - футер (колонка «Документы»);
// - sitemap.xml (какие страницы добавить в карту сайта).
//
// Порядок массива = порядок ссылок в футере.
//
// Документы теперь — функции от реквизитов (getX(req)), потому что
// реквизиты могут приходить из БД. Для реестра (футер/sitemap) нужны
// только slug/navTitle — собираем с дефолтными реквизитами.
// ============================================================

import { getConsent } from '@/lib/legal/consent';
import { getCookiesPolicy } from '@/lib/legal/cookies';
import { getPrivacy } from '@/lib/legal/privacy';
import { DEFAULT_REQUISITES } from '@/lib/legal/requisites';
import { getTerms } from '@/lib/legal/terms';
import type { LegalDocumentData } from '@/lib/legal/types';

export const LEGAL_DOCUMENTS: readonly LegalDocumentData[] = [
    getPrivacy(DEFAULT_REQUISITES),
    getCookiesPolicy(DEFAULT_REQUISITES),
    getTerms(DEFAULT_REQUISITES),
    getConsent(DEFAULT_REQUISITES),
];
