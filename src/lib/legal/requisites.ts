import { OPERATOR } from '@/lib/legal/operator';

// ============================================================
// РЕКВИЗИТЫ САЙТА — ЕДИНЫЙ ИСТОЧНИК ИСТИНЫ
//
// Реквизиты показываются во многих местах (футер, /contacts, юрдоки).
// Они приходят из БД (таблица radius_requisites), а если строки ещё нет —
// из OPERATOR (значения по умолчанию из operator.ts).
//
// Этот файл — ЧИСТАЯ логика без запросов к БД: тип, дефолты и маппер
// строки БД → SiteRequisites. Используется и на клиенте, и на сервере.
// ============================================================

export type SiteRequisites = {
    /** Короткое имя платформы (бренд — из БД не меняется). */
    siteName: string;
    /** Домен сайта (бренд — из БД не меняется). */
    domain: string;
    legalName: string;
    unp: string;
    legalAddress: string;
    supportEmail: string;
    privacyEmail: string;
    supportTelegram: string;
    supportTelegramUrl: string;
    footerEmails: {
        privacy: string;
        support: string;
    };
};

/** Значения по умолчанию — когда строки в БД ещё нет. */
export const DEFAULT_REQUISITES: SiteRequisites = {
    siteName: OPERATOR.siteName,
    domain: OPERATOR.domain,
    legalName: OPERATOR.legalName,
    unp: OPERATOR.unp,
    legalAddress: OPERATOR.legalAddress,
    supportEmail: OPERATOR.supportEmail,
    privacyEmail: OPERATOR.privacyEmail,
    supportTelegram: OPERATOR.supportTelegram,
    supportTelegramUrl: OPERATOR.supportTelegramUrl,
    footerEmails: {
        privacy: OPERATOR.footerEmails.privacy,
        support: OPERATOR.footerEmails.support,
    },
};

/** Форма строки таблицы radius_requisites (что возвращает requisites.get). */
export type RequisitesRow = {
    legalName: string;
    unp: string;
    legalAddress: string;
    supportEmail: string;
    privacyEmail: string;
    supportTelegram: string;
    supportTelegramUrl: string;
    footerPrivacyEmail: string;
    footerSupportEmail: string;
};

/**
 * Строка БД → реквизиты сайта.
 * Строки нет (null/undefined) → значения по умолчанию (OPERATOR).
 * Брендовые поля (siteName, domain) берутся из дефолтов всегда.
 */
export function toSiteRequisites(row: RequisitesRow | null | undefined): SiteRequisites {
    if (!row) {
        return DEFAULT_REQUISITES;
    }
    return {
        siteName: DEFAULT_REQUISITES.siteName,
        domain: DEFAULT_REQUISITES.domain,
        legalName: row.legalName,
        unp: row.unp,
        legalAddress: row.legalAddress,
        supportEmail: row.supportEmail,
        privacyEmail: row.privacyEmail,
        supportTelegram: row.supportTelegram,
        supportTelegramUrl: row.supportTelegramUrl,
        footerEmails: {
            privacy: row.footerPrivacyEmail,
            support: row.footerSupportEmail,
        },
    };
}
