// ============================================================
// /privacy — Политика в отношении обработки персональных данных
// ============================================================
// Текст — в src/lib/legal/privacy.tsx (функция от реквизитов),
// вёрстка — в LegalDocument.
//
// Реквизиты читаются из БД на сервере (fallback — OPERATOR).

import type { GetServerSideProps } from 'next';

import { LegalDocument } from '@/components/legal/LegalDocument';
import { getPrivacy } from '@/lib/legal/privacy';
import { type SiteRequisites, toSiteRequisites } from '@/lib/legal/requisites';
import { createServerCaller } from '@/trpc/server';

type PrivacyPageProps = {
    requisites: SiteRequisites;
};

export const getServerSideProps: GetServerSideProps<PrivacyPageProps> = async (ctx) => {
    const caller = await createServerCaller(ctx);
    const row = await caller.requisites.get();
    return {
        props: {
            requisites: toSiteRequisites(row),
        },
    };
};

export default function PrivacyPage({ requisites }: PrivacyPageProps) {
    return (
        <LegalDocument
            withFooter
            doc={getPrivacy(requisites)}
        />
    );
}
