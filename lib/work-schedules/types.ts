export type WorkScheduleRecord = {
  id: string;
  weekValue: string;
  title: string;
  fileName: string;
  originalName: string;
  /** Liên kết bảng `files` (bản ghi cũ có thể null) */
  fileId: string | null;
  createdAt: string;
  updatedAt: string;
};
