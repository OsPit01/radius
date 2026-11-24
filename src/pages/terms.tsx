// ============================================================
// /terms — Пользовательское соглашение
// ============================================================
// Текст — в src/lib/legal/terms.tsx (функция от реквизитов),
// вёрстка — в LegalDocument. Раздел «Правила размещения объявлений»
// доступен по якорю /terms#landlord (на него ссылается футер).
//
// Реквизиты читаются из БД на сервере (fallback — OPERATOR), поэтому
// после сохранения реквизитов в админке документ сразу показывает новые.

import type { GetServerSideProps } from 'next';

import { LegalDocument } from '@/components/legal/LegalDocument';
import { type SiteRequisites, toSiteRequisites } from '@/lib/legal/requisites';
import { getTerms } from '@/lib/legal/terms';
import { createServerCaller } from '@/trpc/server';

type TermsPageProps = {
    requisites: SiteRequisites;
};

export const getServerSideProps: GetServerSideProps<TermsPageProps> = async (ctx) => {
    const caller = await createServerCaller(ctx);
    const row = await caller.requisites.get();
    return {
        props: {
            requisites: toSiteRequisites(row),
        },
    };
};

export default function TermsPage({ requisites }: TermsPageProps) {
    return (
        <LegalDocument
            withFooter
            doc={getTerms(requisites)}
        />
    );
}
