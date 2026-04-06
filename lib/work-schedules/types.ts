import type { SchedulePeriodKind } from "./period";

export type WorkScheduleRecord = {
  id: string;
  typeId: string;
  typeLabel: string;
  typeCode: string;
  periodKind: SchedulePeriodKind;
  /** Tuần: `YYYY-Www`, tháng: `YYYY-MM`, năm: `YYYY` */
  periodValue: string;
  title: string;
  fileName: string;
  originalName: string;
  /** Liên kết bảng `files` (bản ghi cũ có thể null) */
  fileId: string | null;
  createdAt: string;
  updatedAt: string;
};
