import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { workScheduleTypes } from "@/lib/db/schema";

export type WorkScheduleTypeOption = {
  id: string;
  code: string;
  label: string;
};

export async function listActiveWorkScheduleTypes(): Promise<WorkScheduleTypeOption[]> {
  const rows = await getDb()
    .select({
      id: workScheduleTypes.id,
      code: workScheduleTypes.code,
      label: workScheduleTypes.label,
    })
    .from(workScheduleTypes)
    .where(eq(workScheduleTypes.isActive, true))
    .orderBy(asc(workScheduleTypes.sortOrder), asc(workScheduleTypes.label));

  return rows;
}

export async function getWorkScheduleTypeById(id: string) {
  const [row] = await getDb()
    .select()
    .from(workScheduleTypes)
    .where(eq(workScheduleTypes.id, id))
    .limit(1);
  return row ?? null;
}
