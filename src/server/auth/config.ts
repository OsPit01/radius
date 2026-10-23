import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { type NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';

import type { RoleKey } from '@/lib/constants/roles';
import { db } from '@/server/db';
import { accounts, sessions, users, verificationTokens } from '@/server/db/schema';
// ============================================================
// РАСШИРЯЕМ ТИПЫ ДЛЯ NEXT-AUTH V5
// ============================================================
type Role = RoleKey;
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            image: string | null;
            role: Role;
            /** Дата, до которой аккаунт заблокирован (null — не забанен). */
            bannedUntil: Date | null;
        };
    }

    interface User {
        role: Role;
    }
}

// ============================================================
// !!!!! ВАЖНО: РАСШИРЯЕМ АДАПТЕР ДЛЯ NEXT-AUTH V5 !!!!!
// ============================================================

declare module '@auth/core/adapters' {
    interface AdapterUser {
        role?: Role;
        bannedUntil?: Date | null;
    }
}

// ============================================================
// КОНФИГ
// ============================================================

export const authConfig = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Привязываем вход через Google к уже существующему пользователю с тем же
            // e-mail (например, созданному по ссылке из письма). Безопасно именно для
            // Google: он отдаёт только подтверждённые адреса. Для других провайдеров
            // без проверки e-mail этот флаг включать нельзя.
            allowDangerousEmailAccountLinking: true,
        }),
        Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: 'NaRadare <no-reply@naradare.by>',
        }),
    ],
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    // Самостоятельный хостинг (не Vercel) за nginx: разрешаем Auth.js доверять
    // переданному Host/X-Forwarded-Proto, чтобы callback-URL собирались с
    // реального домена (naradare.by), а не с внутреннего адреса приложения.
    trustHost: true,
    callbacks: {
        session: ({ session, user }) => {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: user.id,
                    role: user.role ?? 'user',
                    bannedUntil: user.bannedUntil ?? null,
                },
            };
        },
    },
    pages: {
        signIn: '/auth/signin',
    },
} satisfies NextAuthConfig;
