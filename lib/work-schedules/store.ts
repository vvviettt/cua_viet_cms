import { and, asc, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { workSchedules, workScheduleTypes } from "@/lib/db/schema";
import type { SchedulePeriodKind } from "./period";
import type { WorkScheduleRecord } from "./types";

type ScheduleRow = {
  schedule: typeof workSchedules.$inferSelect;
  typeLabel: string;
  typeCode: string;
};

function toRecord(row: ScheduleRow): WorkScheduleRecord {
  const s = row.schedule;
  return {
    id: s.id,
    typeId: s.typeId,
    typeLabel: row.typeLabel,
    typeCode: row.typeCode,
    periodKind: s.periodKind,
    periodValue: s.periodValue,
    title: s.title,
    fileName: s.fileName,
    originalName: s.originalName,
    fileId: s.fileId ?? null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export async function listWorkSchedules(): Promise<WorkScheduleRecord[]> {
  const rows = await getDb()
    .select({
      schedule: workSchedules,
      typeLabel: workScheduleTypes.label,
      typeCode: workScheduleTypes.code,
    })
    .from(workSchedules)
    .innerJoin(workScheduleTypes, eq(workSchedules.typeId, workScheduleTypes.id))
    .orderBy(
      asc(workScheduleTypes.sortOrder),
      asc(workSchedules.periodKind),
      desc(workSchedules.periodValue),
      desc(workSchedules.updatedAt),
    );

  return rows.map(toRecord);
}

export const WORK_SCHEDULE_LIST_PAGE_SIZE = 10;

export async function listWorkSchedulesPaginated(
  page: number,
  pageSize: number,
): Promise<{
  items: WorkScheduleRecord[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const db = getDb();

  const [countRow] = await db
    .select({ c: count() })
    .from(workSchedules)
    .innerJoin(workScheduleTypes, eq(workSchedules.typeId, workScheduleTypes.id));

  const total = Number(countRow?.c ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
  const offset = totalPages === 0 ? 0 : (safePage - 1) * pageSize;

  const rows = await db
    .select({
      schedule: workSchedules,
      typeLabel: workScheduleTypes.label,
      typeCode: workScheduleTypes.code,
    })
    .from(workSchedules)
    .innerJoin(workScheduleTypes, eq(workSchedules.typeId, workScheduleTypes.id))
    .orderBy(
      asc(workScheduleTypes.sortOrder),
      asc(workSchedules.periodKind),
      desc(workSchedules.periodValue),
      desc(workSchedules.updatedAt),
    )
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map(toRecord),
    total,
    page: safePage,
    pageSize,
  };
}

export async function findBySchedulePeriod(
  typeId: string,
  periodKind: SchedulePeriodKind,
  periodValue: string,
): Promise<WorkScheduleRecord | null> {
  const [row] = await getDb()
    .select({
      schedule: workSchedules,
      typeLabel: workScheduleTypes.label,
      typeCode: workScheduleTypes.code,
    })
    .from(workSchedules)
    .innerJoin(workScheduleTypes, eq(workSchedules.typeId, workScheduleTypes.id))
    .where(
      and(
        eq(workSchedules.typeId, typeId),
        eq(workSchedules.periodKind, periodKind),
        eq(workSchedules.periodValue, periodValue),
      ),
    )
    .limit(1);

  return row ? toRecord(row) : null;
}

export async function findWorkScheduleById(scheduleId: string): Promise<WorkScheduleRecord | null> {
  const [row] = await getDb()
    .select({
      schedule: workSchedules,
      typeLabel: workScheduleTypes.label,
      typeCode: workScheduleTypes.code,
    })
    .from(workSchedules)
    .innerJoin(workScheduleTypes, eq(workSchedules.typeId, workScheduleTypes.id))
    .where(eq(workSchedules.id, scheduleId))
    .limit(1);

  return row ? toRecord(row) : null;
}

export async function updateWorkScheduleTitleById(scheduleId: string, title: string): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(workSchedules)
    .set({ title, updatedAt: now })
    .where(eq(workSchedules.id, scheduleId));
}

export async function upsertWorkSchedule(
  record: Omit<WorkScheduleRecord, "typeLabel" | "typeCode" | "createdAt" | "updatedAt"> & {
    createdAt?: string;
  },
): Promise<WorkScheduleRecord> {
  const now = new Date().toISOString();
  const next = {
    ...record,
    fileId: record.fileId ?? null,
    createdAt: record.createdAt ?? now,
    updatedAt: now,
  };

  const [row] = await getDb()
    .insert(workSchedules)
    .values({
      id: next.id,
      typeId: next.typeId,
      periodKind: next.periodKind,
      periodValue: next.periodValue,
      title: next.title,
      fileName: next.fileName,
      originalName: next.originalName,
      fileId: next.fileId,
      createdAt: next.createdAt,
      updatedAt: next.updatedAt,
    })
    .onConflictDoUpdate({
      target: [workSchedules.typeId, workSchedules.periodKind, workSchedules.periodValue],
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

  const [joined] = await getDb()
    .select({
      schedule: workSchedules,
      typeLabel: workScheduleTypes.label,
      typeCode: workScheduleTypes.code,
    })
    .from(workSchedules)
    .innerJoin(workScheduleTypes, eq(workSchedules.typeId, workScheduleTypes.id))
    .where(eq(workSchedules.id, row.id))
    .limit(1);

  if (!joined) {
    throw new Error("Không tải lại bản ghi lịch.");
  }
  return toRecord(joined);
}
