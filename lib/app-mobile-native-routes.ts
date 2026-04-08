/** Các route native hợp lệ — khớp registry trong app Flutter. */
export const APP_MOBILE_NATIVE_ROUTE_IDS = [
  { id: "citizen_reception_schedule", label: "Lịch làm việc / Tiếp công dân" },
  { id: "news_list", label: "Tin tức" },
  { id: "feedback_hub", label: "Phản ánh & kiến nghị" },
  { id: "hotlines", label: "Đường dây nóng" },
  { id: "staff_ratings", label: "Đánh giá cán bộ" },
  { id: "none", label: "Không điều hướng (giữ ô trang trí)" },
] as const;

export type AppMobileNativeRouteId = (typeof APP_MOBILE_NATIVE_ROUTE_IDS)[number]["id"];

export function isValidNativeRouteId(id: string): id is AppMobileNativeRouteId {
  return (APP_MOBILE_NATIVE_ROUTE_IDS as readonly { id: string }[]).some((r) => r.id === id);
}
