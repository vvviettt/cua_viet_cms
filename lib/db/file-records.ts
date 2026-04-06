import type { InferInsertModel } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { files } from "@/lib/db/schema";

export type NewFileRecord = Omit<InferInsertModel<typeof files>, "id">;

export async function insertUploadedFile(
  input: Omit<NewFileRecord, "createdAt"> & { createdAt?: string },
): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(files)
    .values({
      ...input,
      createdAt: input.createdAt ?? now,
    })
    .returning({ id: files.id });

  if (!row) {
    throw new Error("Không thể lưu bản ghi file.");
  }
  return row.id;
}
