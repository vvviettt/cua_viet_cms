export type CitizenFeedbackKind = "phan_anh" | "kien_nghi";

export type CitizenFeedbackStatus = "received" | "processing" | "answered" | "closed";

export type CitizenFeedbackRecord = {
  id: string;
  kind: CitizenFeedbackKind;
  title: string;
  content: string;
  citizenAccountId: string;
  /** Họ tên từ `citizen_accounts`. */
  accountFullName: string;
  accountPhone: string;
  accountEmail: string | null;
  status: CitizenFeedbackStatus;
  /** `users.id` của cán bộ đánh dấu đã trả lời (khi trạng thái `answered` / có thể giữ khi `closed`). */
  answeredByUserId: string | null;
  /** Hiển thị: họ tên hoặc email tài khoản CMS. */
  answeredByName: string | null;
  /** Trả lời chính thức cho người dân (khác ghi chú nội bộ). */
  staffReply: string | null;
  /** true: không hiển thị trên ứng dụng người dân (CMS vẫn xem được). */
  hiddenFromApp: boolean;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export const FEEDBACK_KIND_LABELS: Record<CitizenFeedbackKind, string> = {
  phan_anh: "Phản ánh",
  kien_nghi: "Kiến nghị",
};

export const FEEDBACK_STATUS_LABELS: Record<CitizenFeedbackStatus, string> = {
  received: "Mới tiếp nhận",
  processing: "Đang xử lý",
  answered: "Đã trả lời",
  closed: "Đã đóng",
};
