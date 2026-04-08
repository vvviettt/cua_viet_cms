/** Khóa icon Material — khớp map trong app Flutter. */
export const APP_MOBILE_ICON_KEYS = [
  { key: "calendar_month", label: "Lịch" },
  { key: "newspaper", label: "Tin tức" },
  { key: "rate_review", label: "Phản ánh / đánh giá" },
  { key: "phone_in_talk", label: "Điện thoại" },
  { key: "star_rounded", label: "Ngôi sao" },
  { key: "quiz_outlined", label: "Câu hỏi / thi" },
  { key: "file_upload_outlined", label: "Tải/Nộp hồ sơ" },
  { key: "groups_outlined", label: "Nhóm người" },
  { key: "manage_search", label: "Tra cứu" },
  { key: "menu_book_outlined", label: "Sách hướng dẫn" },
  { key: "book_outlined", label: "Sổ / sách" },
  { key: "health_and_safety_outlined", label: "Bảo hiểm / an toàn" },
  { key: "school_outlined", label: "Trường học" },
  { key: "traffic_outlined", label: "Giao thông" },
  { key: "receipt_long_outlined", label: "Hóa đơn / thuế" },
  { key: "folder_copy_outlined", label: "Thư mục" },
  { key: "public_outlined", label: "Web / công cộng" },
  { key: "account_balance_outlined", label: "Cơ quan / HDND" },
  { key: "help_outline", label: "Mặc định (dấu hỏi)" },
] as const;

export function isValidAppMobileIconKey(k: string): boolean {
  return (APP_MOBILE_ICON_KEYS as readonly { key: string }[]).some((x) => x.key === k);
}
