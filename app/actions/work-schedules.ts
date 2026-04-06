"use server";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { insertUploadedFile } from "@/lib/db/file-records";
import { canEditContent } from "@/lib/roles";
import { findByWeek, upsertWorkSchedule } from "@/lib/work-schedules/store";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "lich-lam-viec");
const MAX_BYTES = 10 * 1024 * 1024;
const RELATIVE_PREFIX = "lich-lam-viec";

export type WorkScheduleFormState = { ok?: boolean; error?: string };

export async function createOrUpdateWorkSchedule(
  _prev: WorkScheduleFormState,
  formData: FormData,
): Promise<WorkScheduleFormState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!canEditContent(session.role)) {
    return { error: "Tài khoản của bạn không có quyền tải lên hoặc sửa lịch." };
  }

  const weekValue = String(formData.get("week") ?? "").trim();
  const titleRaw = String(formData.get("title") ?? "").trim();
  const file = formData.get("file");

  if (!weekValue) {
    return { error: "Vui lòng chọn tuần." };
  }
  if (!/^\d{4}-W\d{2}$/.test(weekValue)) {
    return { error: "Giá trị tuần không hợp lệ." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Vui lòng chọn file PDF." };
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

  await mkdir(UPLOAD_DIR, { recursive: true });

  const existing = await findByWeek(weekValue);
  const safeWeek = weekValue.replace(/[^0-9W-]/g, "");
  const fileName = `${safeWeek}-${randomUUID()}.pdf`;
  const relativePath = `${RELATIVE_PREFIX}/${fileName}`;

  await writeFile(path.join(UPLOAD_DIR, fileName), buf);

  if (existing?.fileName && existing.fileName !== fileName) {
    try {
      await unlink(path.join(UPLOAD_DIR, existing.fileName));
    } catch {
      /* ignore */
    }
  }

  const title =
    titleRaw ||
    (() => {
      const [, y, w] = /^(\d{4})-W(\d{2})$/.exec(weekValue) ?? [];
      return y && w ? `Lịch làm việc Tuần ${parseInt(w, 10)} — ${y}` : `Lịch làm việc ${weekValue}`;
    })();

  const fileId = await insertUploadedFile({
    category: "work_schedule",
    relativePath,
    originalName: file.name,
    mimeType: file.type || "application/pdf",
    sizeBytes: buf.length,
    uploadedById: session.userId,
  });

  await upsertWorkSchedule({
    id: existing?.id ?? randomUUID(),
    weekValue,
    title,
    fileName,
    originalName: file.name,
    fileId,
  });

  revalidatePath("/lich-lam-viec");
  return { ok: true };
}
