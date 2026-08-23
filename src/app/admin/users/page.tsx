"use client";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { isAdminRole, getRoleInfo } from "@/lib/constants/roles";

export default function Users() {
  const { data: session } = useSession();
  const { data: users, isLoading } = api.user.getAll.useQuery();
  if (!isAdminRole(session?.user?.role)) {
    return (
      <>
        <AuthGuard>
          <ClientHeader />
          <div className="p-[60px_20px] text-center text-lg">
            У ВАС НЕТ ДОСТУПА!
          </div>
        </AuthGuard>
      </>
    );
  }
  if (isAdminRole(session?.user?.role)) {
    return (
      <>
        <AuthGuard>
          <ClientHeader />
          <div className="p-[60px_20px] text-center text-lg">
            Добро пожаловать!
          </div>
        </AuthGuard>
      </>
    );
  }
}
