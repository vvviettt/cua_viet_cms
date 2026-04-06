export const USER_ROLES = ["admin", "editor", "viewer"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

/** Nhãn hiển thị (CMS nội bộ xã) */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Quản trị viên",
  editor: "Biên tập viên",
  viewer: "Chỉ xem",
};

export function canEditContent(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}
