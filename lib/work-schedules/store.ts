import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { workSchedules } from "@/lib/db/schema";
import type { WorkScheduleRecord } from "./types";

function rowToRecord(row: typeof workSchedules.$inferSelect): WorkScheduleRecord {
  return {
    id: row.id,
    weekValue: row.weekValue,
    title: row.title,
    fileName: row.fileName,
    originalName: row.originalName,
    fileId: row.fileId ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listWorkSchedules(): Promise<WorkScheduleRecord[]> {
  const rows = await getDb().select().from(workSchedules);
  return rows.map(rowToRecord).sort((a, b) => {
    if (a.weekValue === b.weekValue) return b.updatedAt.localeCompare(a.updatedAt);
    return b.weekValue.localeCompare(a.weekValue);
  });
}

export async function findByWeek(weekValue: string): Promise<WorkScheduleRecord | null> {
  const [row] = await getDb()
    .select()
    .from(workSchedules)
    .where(eq(workSchedules.weekValue, weekValue))
    .limit(1);
  return row ? rowToRecord(row) : null;
}

export async function upsertWorkSchedule(
  record: Omit<WorkScheduleRecord, "createdAt" | "updatedAt"> & { createdAt?: string },
): Promise<WorkScheduleRecord> {
  const now = new Date().toISOString();
  const next: WorkScheduleRecord = {
    ...record,
    fileId: record.fileId ?? null,
    createdAt: record.createdAt ?? now,
    updatedAt: now,
  };

  const [row] = await getDb()
    .insert(workSchedules)
    .values({
      id: next.id,
      weekValue: next.weekValue,
      title: next.title,
      fileName: next.fileName,
      originalName: next.originalName,
      fileId: next.fileId,
      createdAt: next.createdAt,
      updatedAt: next.updatedAt,
    })
    .onConflictDoUpdate({
      target: workSchedules.weekValue,
      set: {
        title: next.title,
        fileName: next.fileName,
        originalName: next.originalName,
        fileId: next.fileId,
        updatedAt: next.updatedAt,
      },
    })
    .returning();

  if (!row) {
    throw new Error("Không thể lưu lịch làm việc.");
  }
  return rowToRecord(row);
}

export function weekValueToLabel(weekValue: string): string {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekValue);
  if (!m) return weekValue;
  const weekNum = parseInt(m[2]!, 10);
  return `Tuần ${weekNum} — ${m[1]}`;
}
