export const APP_MOBILE_NOTIFICATION_CATEGORIES = [
  "system",
  "news",
  "plan",
  "event",
] as const;

export type AppMobileNotificationCategory = (typeof APP_MOBILE_NOTIFICATION_CATEGORIES)[number];

export const APP_MOBILE_NOTIFICATION_CATEGORY_LABELS: Record<AppMobileNotificationCategory, string> = {
  system: "Hệ thống",
  news: "Tin tức",
  plan: "Kế hoạch",
  event: "Sự kiện",
};

export function isAppMobileNotificationCategory(v: string): v is AppMobileNotificationCategory {
  return (APP_MOBILE_NOTIFICATION_CATEGORIES as readonly string[]).includes(v);
}
