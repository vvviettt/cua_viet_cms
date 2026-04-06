import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { publicServiceHotlines } from "@/lib/db/schema";

export type PublicHotlineRow = typeof publicServiceHotlines.$inferSelect;

/** Toàn bộ dòng (CMS), sắp xếp thứ tự hiển thị. */
export async function listPublicHotlinesForCms(): Promise<PublicHotlineRow[]> {
  return getDb()
    .select()
    .from(publicServiceHotlines)
    .orderBy(asc(publicServiceHotlines.sortOrder), asc(publicServiceHotlines.serviceName));
}

/** Chỉ dòng đang bật — dùng cho API/ứng dụng. */
export async function listPublicHotlinesActive(): Promise<PublicHotlineRow[]> {
  return getDb()
    .select()
    .from(publicServiceHotlines)
    .where(eq(publicServiceHotlines.isActive, true))
    .orderBy(asc(publicServiceHotlines.sortOrder), asc(publicServiceHotlines.serviceName));
}

export async function findPublicHotlineById(id: string): Promise<PublicHotlineRow | null> {
  const [row] = await getDb()
    .select()
    .from(publicServiceHotlines)
    .where(eq(publicServiceHotlines.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertPublicHotline(values: {
  serviceName: string;
  phone: string;
  note: string | null;
  sortOrder: number;
  isActive: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(publicServiceHotlines)
    .values({
      serviceName: values.serviceName,
      phone: values.phone,
      note: values.note,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: publicServiceHotlines.id });
  if (!row) throw new Error("Không thể thêm đường dây nóng.");
  return row.id;
}

export async function updatePublicHotline(
  id: string,
  values: {
    serviceName: string;
    phone: string;
    note: string | null;
    sortOrder: number;
    isActive: boolean;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(publicServiceHotlines)
    .set({
      serviceName: values.serviceName,
      phone: values.phone,
      note: values.note,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      updatedAt: now,
    })
    .where(eq(publicServiceHotlines.id, id));
}

export async function deletePublicHotline(id: string): Promise<void> {
  await getDb().delete(publicServiceHotlines).where(eq(publicServiceHotlines.id, id));
}
