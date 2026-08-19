"use client";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";

export default function BookingsPage() {
  return (
    <AuthGuard>
      <ClientHeader />
      <div>
        <span className="max-md: mx-4 flex items-center justify-center pt-50 text-[30px]">
          Этот раздел пока недоступен
        </span>
      </div>
    </AuthGuard>
  );
}
