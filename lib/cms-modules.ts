export const CMS_MODULES = [
  { key: "work_schedule", label: "Quản lý lịch làm việc" },
  { key: "staff", label: "Cán bộ, công nhân viên" },
  { key: "citizen_feedback", label: "Phản ánh kiến nghị" },
  { key: "hotline", label: "Đường dây nóng" },
  { key: "news", label: "Tin tức" },
  { key: "app_mobile", label: "Ứng dụng di động" },
  { key: "user_management", label: "Quản lý người dùng" },
] as const;

export type CmsModuleKey = (typeof CMS_MODULES)[number]["key"];

export const CMS_MODULE_KEYS = CMS_MODULES.map((m) => m.key) as readonly CmsModuleKey[];

export function isCmsModuleKey(value: string): value is CmsModuleKey {
  return (CMS_MODULE_KEYS as readonly string[]).includes(value);
}
