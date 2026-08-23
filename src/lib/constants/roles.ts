// ============================================================
// src/lib/constants/roles.ts - РОЛИ
// ============================================================

type RoleInfo = {
  label: string;
  color: string;
  level: number;
};

// ===== ВСЕ РОЛИ =====
export const ROLES = {
  user: {
    label: "Пользователь",
    color: "#000000c4",
    level: 0,
  },
  lessor: {
    label: "Арендодатель",
    color: "#28a745",
    level: 1,
  },
  admin: {
    label: "Администратор",
    color: "#007bff",
    level: 2,
  },
  superadmin: {
    label: "Супер Админ",
    color: "#dc3545",
    level: 3,
  },
  mainadmin: {
    label: "Главный Админ",
    color: "#fd7e14",
    level: 4,
  },
};

// ===== ТИП ДЛЯ КЛЮЧЕЙ РОЛЕЙ =====
export type RoleKey = keyof typeof ROLES;

// ===== ВСЕ РОЛИ ДЛЯ ZOD =====
export const ROLE_VALUES = Object.keys(ROLES) as [RoleKey, ...RoleKey[]];

// ===== АДМИН-РОЛИ =====
export const ADMIN_ROLES: readonly RoleKey[] = [
  "user",
  "lessor",
  "admin",
  "superadmin",
  "mainadmin",
];

export function isAdminRole(role: string | undefined | null): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

// ===== ПОЛУЧИТЬ ИНФОРМАЦИЮ О РОЛИ =====
export function getRoleInfo(role: string): RoleInfo {
  // Проверяем, есть ли такая роль
  if (role in ROLES) {
    return ROLES[role as RoleKey];
  }
  // Если нет — возвращаем user
  return ROLES.user;
}

// ===== ПРОВЕРКА ПРАВ =====
export function hasPermission(
  userRole: string,
  requiredRole: RoleKey,
): boolean {
  const userInfo = getRoleInfo(userRole);
  const requiredInfo = ROLES[requiredRole];
  return userInfo.level >= requiredInfo.level;
}

// ===== ВСЕ РОЛИ ДЛЯ СПИСКОВ =====
export const ROLE_LIST = Object.keys(ROLES);

// ===== ДЛЯ SELECT =====
export const ROLE_OPTIONS = ROLE_LIST.map((key) => ({
  value: key,
  label: ROLES[key as RoleKey].label,
}));
