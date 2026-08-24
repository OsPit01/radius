"use client";

import { getRoleInfo, type RoleKey } from "@/lib/constants/roles";
import { api } from "@/trpc/react";
import { useState } from "react";

type AdminUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
};

type UserCardProps = {
  user: AdminUser;
  allowedRoles: { value: string; label: string }[];
};

export function UserCard({ user, allowedRoles }: UserCardProps) {
  const roleInfo = getRoleInfo(user.role);
  const initial = (user.firstName?.[0] ?? user.email?.[0] ?? "?").toUpperCase();

  const [selectedRole, setSelectedRole] = useState<RoleKey | "">("");
  const utils = api.useUtils();
  const updateRole = api.user.updateRole.useMutation({
    onSuccess: () => {
      void utils.user.getAll.invalidate();
    },
  });

  return (
    <div className="flex flex-col rounded-2xl border border-[#e5e5e5] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Шапка: аватар + имя + email */}
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#b552c7] text-xl font-bold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-[#222]">
            {user.firstName ?? user.email}
          </p>
          <p className="truncate text-sm text-[#666]">{user.email}</p>
        </div>
      </div>

      {/* Бейдж роли */}
      <span
        style={{ background: roleInfo.color }}
        className="mt-4 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase"
      >
        {roleInfo.label}
      </span>

      {/* Смена роли */}
      <div className="mt-4 flex items-center gap-2">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as RoleKey)}
          className="flex-1 cursor-pointer rounded-lg border border-[#ddd] bg-white px-3 py-2 text-sm text-[#222] outline-none focus:border-[#b552c7]"
        >
          {/* выбрать роль */}
          <option>Выбрать роль...</option>
          {allowedRoles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <button
          className="cursor-pointer rounded-[30px] bg-[#b552c7] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#9a3fb0]"
          onClick={() => {
            if (!selectedRole) return;
            updateRole.mutate({ userId: user.id, role: selectedRole });
          }}
          disabled={!selectedRole || updateRole.isPending}
        >
          Сохранить
        </button>
      </div>

      {/* Бан (заглушка) */}
      <button className="mt-2 cursor-pointer rounded-[30px] border border-[#e5e5e5] px-5 py-2 text-sm font-medium text-[#666] transition-colors hover:border-red-400 hover:text-red-500">
        Забанить
      </button>
    </div>
  );
}
