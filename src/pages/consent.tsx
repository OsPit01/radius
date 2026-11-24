// ============================================================
// /consent — Согласие на обработку персональных данных
// ============================================================
// Текст, на который ссылаются галочки в формах. Закрыт от индексации.
//
// Реквизиты читаются из БД на сервере (fallback — OPERATOR).

import type { GetServerSideProps } from 'next';

import { LegalDocument } from '@/components/legal/LegalDocument';
import { getConsent } from '@/lib/legal/consent';
import { type SiteRequisites, toSiteRequisites } from '@/lib/legal/requisites';
import { createServerCaller } from '@/trpc/server';

type ConsentPageProps = {
    requisites: SiteRequisites;
};

export const getServerSideProps: GetServerSideProps<ConsentPageProps> = async (ctx) => {
    const caller = await createServerCaller(ctx);
    const row = await caller.requisites.get();
    return {
        props: {
            requisites: toSiteRequisites(row),
        },
    };
};

export default function ConsentPage({ requisites }: ConsentPageProps) {
    return (
        <LegalDocument
            withFooter
            doc={getConsent(requisites)}
        />
    );
}
