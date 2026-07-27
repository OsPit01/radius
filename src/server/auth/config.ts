import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/server/db/schema";

// ============================================================
// РАСШИРЯЕМ ТИПЫ ДЛЯ NEXT-AUTH V5
// ============================================================

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    };
  }

  interface User {
    role: string;
  }
}

// ============================================================
// !!!!! ВАЖНО: РАСШИРЯЕМ АДАПТЕР ДЛЯ NEXT-AUTH V5 !!!!!
// ============================================================

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role?: string;
  }
}

// ============================================================
// КОНФИГ
// ============================================================

export const authConfig = {
  providers: [
    DiscordProvider,
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  callbacks: {
    session: ({ session, user }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role: user.role ?? "user",
        },
      };
    },
  },
} satisfies NextAuthConfig;
