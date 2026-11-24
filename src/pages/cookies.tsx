// ============================================================
// /cookies — Политика использования cookie
// ============================================================
// Внизу документа — кнопка «Настроить cookie»: пользователь может
// изменить категории согласия в любой момент.
//
// Реквизиты читаются из БД на сервере (fallback — OPERATOR).

import type { GetServerSideProps } from 'next';

import { CookieSettingsButton } from '@/components/consent/CookieSettingsButton';
import { LegalDocument } from '@/components/legal/LegalDocument';
import { getCookiesPolicy } from '@/lib/legal/cookies';
import { type SiteRequisites, toSiteRequisites } from '@/lib/legal/requisites';
import { createServerCaller } from '@/trpc/server';

type CookiesPageProps = {
    requisites: SiteRequisites;
};

export const getServerSideProps: GetServerSideProps<CookiesPageProps> = async (ctx) => {
    const caller = await createServerCaller(ctx);
    const row = await caller.requisites.get();
    return {
        props: {
            requisites: toSiteRequisites(row),
        },
    };
};

export default function CookiesPage({ requisites }: CookiesPageProps) {
    return (
        <LegalDocument
            withFooter
            doc={getCookiesPolicy(requisites)}
            footer={<CookieSettingsButton />}
        />
    );
}
