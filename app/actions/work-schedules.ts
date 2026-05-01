"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session-cookie";
import { insertUploadedFile } from "@/lib/db/file-records";
import { getWorkScheduleTypeById } from "@/lib/db/work-schedule-types";
import { sessionCanEditModule } from "@/lib/cms-module-access";
import { isSchedulePeriodKind, type SchedulePeriodKind } from "@/lib/work-schedules/period";
import { removeSupabaseObject, uploadBufferToSupabase } from "@/lib/uploads/supabase-storage";
import {
  findBySchedulePeriod,
  findWorkScheduleById,
  updateWorkScheduleTitleById,
  upsertWorkSchedule,
} from "@/lib/work-schedules/store";

const MAX_BYTES = 10 * 1024 * 1024;
const RELATIVE_PREFIX = "lich-lam-viec";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type WorkScheduleFormState = { ok?: boolean; error?: string };

function parsePeriodValue(
  kind: SchedulePeriodKind,
  formData: FormData,
): { ok: true; value: string } | { ok: false; error: string } {
  if (kind === "week") {
    const v = String(formData.get("week") ?? "").trim();
    if (!v) return { ok: false, error: "Vui lòng chọn tuần." };
    if (!/^\d{4}-W\d{2}$/.test(v)) return { ok: false, error: "Giá trị tuần không hợp lệ." };
    return { ok: true, value: v };
  }
  if (kind === "month") {
    const v = String(formData.get("month") ?? "").trim();
    if (!v) return { ok: false, error: "Vui lòng chọn tháng." };
    if (!/^\d{4}-\d{2}$/.test(v)) return { ok: false, error: "Tháng không hợp lệ (định dạng YYYY-MM)." };
    return { ok: true, value: v };
  }
  const raw = String(formData.get("year") ?? "").trim();
  if (!raw) return { ok: false, error: "Vui lòng nhập năm." };
  const y = parseInt(raw, 10);
  if (!Number.isFinite(y) || y < 1900 || y > 2100) {
    return { ok: false, error: "Năm phải từ 1900 đến 2100." };
  }
  return { ok: true, value: String(y) };
}

function defaultTitlePart(kind: SchedulePeriodKind, periodValue: string): string {
  if (kind === "week") {
    const [, y, w] = /^(\d{4})-W(\d{2})$/.exec(periodValue) ?? [];
    return y && w ? `Tuần ${parseInt(w, 10)} — ${y}` : periodValue;
  }
  if (kind === "month") {
    const [, y, m] = /^(\d{4})-(\d{2})$/.exec(periodValue) ?? [];
    return y && m ? `Tháng ${parseInt(m, 10)}/${y}` : periodValue;
  }
  return `Năm ${periodValue}`;
}

function safeFileSlug(kind: SchedulePeriodKind, periodValue: string): string {
  const base = periodValue.replace(/[^0-9A-Za-z-]/g, "_");
  const k = kind === "week" ? "w" : kind === "month" ? "m" : "y";
  return `${k}-${base}`;
}

type ScheduleTypeRow = NonNullable<Awaited<ReturnType<typeof getWorkScheduleTypeById>>>;

async function persistPdfAndSchedule(params: {
  session: SessionPayload;
  scheduleType: ScheduleTypeRow;
  periodKind: SchedulePeriodKind;
  periodValue: string;
  titleRaw: string;
  buf: Buffer;
  originalName: string;
  mimeType: string;
}): Promise<WorkScheduleFormState> {
  const { session, scheduleType, periodKind, periodValue, titleRaw, buf, originalName, mimeType } =
    params;

  if (buf.length > MAX_BYTES) {
    return { error: "File PDF tối đa 10MB." };
  }

  const existing = await findBySchedulePeriod(scheduleType.id, periodKind, periodValue);
  const fileSlug = safeFileSlug(periodKind, periodValue);
  const fileName = `${fileSlug}-${randomUUID()}.pdf`;
  const relativePath = `${RELATIVE_PREFIX}/${fileName}`;

  await uploadBufferToSupabase({
    relativePath,
    buf,
    contentType: mimeType || "application/pdf",
    cacheControl: "3600",
    upsert: false,
  });

  if (existing?.fileName && existing.fileName !== fileName) {
    try {
      await removeSupabaseObject(`${RELATIVE_PREFIX}/${existing.fileName}`);
    } catch {
      /* ignore */
    }
  }

  const title =
    titleRaw ||
    `${scheduleType.label} — ${defaultTitlePart(periodKind, periodValue)}`;

  const fileId = await insertUploadedFile({
    category: "work_schedule",
    relativePath,
    originalName,
    mimeType: mimeType || "application/pdf",
    sizeBytes: buf.length,
    uploadedById: session.userId,
  });

  await upsertWorkSchedule({
    id: existing?.id ?? randomUUID(),
    typeId: scheduleType.id,
    periodKind,
    periodValue,
    title,
    fileName,
    originalName,
    fileId,
  });

  revalidatePath("/lich-lam-viec");
  revalidatePath("/lich-lam-viec/cap-nhat");
  return { ok: true };
}

export async function createOrUpdateWorkSchedule(
  _prev: WorkScheduleFormState,
  formData: FormData,
): Promise<WorkScheduleFormState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!(await sessionCanEditModule(session, "work_schedule"))) {
    return { error: "Tài khoản của bạn không có quyền tải lên hoặc sửa lịch." };
  }

  const typeIdRaw = String(formData.get("scheduleTypeId") ?? "").trim();
  if (!typeIdRaw || !UUID_RE.test(typeIdRaw)) {
    return { error: "Vui lòng chọn loại lịch." };
  }

  const scheduleType = await getWorkScheduleTypeById(typeIdRaw);
  if (!scheduleType || !scheduleType.isActive) {
    return { error: "Loại lịch không hợp lệ hoặc đã ngừng sử dụng." };
  }

  const periodKindRaw = String(formData.get("periodKind") ?? "").trim();
  if (!isSchedulePeriodKind(periodKindRaw)) {
    return { error: "Vui lòng chọn kiểu thời gian (Tuần / Tháng / Năm)." };
  }
  const periodKind = periodKindRaw;

  const parsed = parsePeriodValue(periodKind, formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const periodValue = parsed.value;

  const titleRaw = String(formData.get("title") ?? "").trim();
  const file = formData.get("file");

  const hasFile = file instanceof File && file.size > 0;

  if (!hasFile) {
    let existing = await findBySchedulePeriod(scheduleType.id, periodKind, periodValue);
    if (!existing) {
      const editId = String(formData.get("workScheduleId") ?? "").trim();
      if (editId && UUID_RE.test(editId)) {
        existing = await findWorkScheduleById(editId);
      }
    }
    if (!existing) {
      return { error: "Vui lòng chọn file PDF." };
    }
    const titleOnly =
      titleRaw ||
      `${scheduleType.label} — ${defaultTitlePart(periodKind, periodValue)}`;
    await updateWorkScheduleTitleById(existing.id, titleOnly);
    revalidatePath("/lich-lam-viec");
    revalidatePath("/lich-lam-viec/cap-nhat");
    return { ok: true };
  }

  if (!(file instanceof File)) {
    return { error: "Vui lòng chọn file PDF ." };
  }

  if (file.size > MAX_BYTES) {
    return { error: "File PDF tối đa 10MB." };
  }
  const nameLower = file.name.toLowerCase();
  const looksPdf =
    file.type === "application/pdf" ||
    nameLower.endsWith(".pdf") ||
    file.type === "application/octet-stream";
  if (!looksPdf || !nameLower.endsWith(".pdf")) {
    return { error: "Chỉ chấp nhận file đuôi .pdf" };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length < 5 || buf.subarray(0, 4).toString("ascii") !== "%PDF") {
    return { error: "Nội dung file không phải PDF hợp lệ." };
  }
  return persistPdfAndSchedule({
    session,
    scheduleType,
    periodKind,
    periodValue,
    titleRaw,
    buf,
    originalName: file.name,
    mimeType: file.type || "application/pdf",
  });
}
