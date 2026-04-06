import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { citizenAccounts } from "@/lib/db/schema";

export async function findCitizenAccountIdByPhone(phone: string): Promise<string | null> {
  const normalized = phone.trim();
  if (!normalized) return null;
  const [row] = await getDb()
    .select({ id: citizenAccounts.id })
    .from(citizenAccounts)
    .where(eq(citizenAccounts.phone, normalized))
    .limit(1);
  return row?.id ?? null;
}
