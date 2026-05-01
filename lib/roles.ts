/** Quản trị (quản lý user CMS, phân quyền, bật/tắt tài khoản ứng dụng). */
export function canManageUsers(isAdmin: boolean): boolean {
  return isAdmin;
}
