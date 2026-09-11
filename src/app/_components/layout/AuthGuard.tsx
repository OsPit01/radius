"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ClientHeader } from "./ClientHeader";
import { LoadingSpinner } from "@/app/_components/ui/LoadingSpinner";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <>
        <ClientHeader />
        <LoadingSpinner label="Загрузка..." />
      </>
    );
  }

  if (status === "unauthenticated") {
    return (
      <>
        <ClientHeader />
        <div className="mx-auto max-w-[1200px] px-5 py-10 max-md:px-4 max-md:py-5">
          <div className="rounded-2xl bg-[#f8f8f8] p-[80px_20px] text-center">
            <p className="mb-5 text-lg text-[#666]">
              Пожалуйста, войдите в систему
            </p>
            <Link
              href="/auth/signin"
              className="inline-block cursor-pointer rounded-[30px] border-none bg-gray-800 px-8 py-3 text-base font-medium text-white no-underline transition-colors duration-200 hover:bg-gray-700"
            >
              Войти
            </Link>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
