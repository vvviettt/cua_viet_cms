import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { appPushDeviceTokens } from "@/lib/db/schema";

export type AppPushPlatform = "android" | "ios";
export type AppPushDeviceTokenRow = typeof appPushDeviceTokens.$inferSelect;

export async function listAllFcmTokens(): Promise<string[]> {
  const rows = await getDb()
    .select({ token: appPushDeviceTokens.fcmToken })
    .from(appPushDeviceTokens);
  return rows.map((r) => r.token);
}

export async function countFcmTokens(): Promise<number> {
  const rows = await listAllFcmTokens();
  return rows.length;
}

export async function upsertAppPushDeviceToken(values: {
  fcmToken: string;
  platform: AppPushPlatform;
  citizenAccountId: string | null;
  deviceId: string | null;
}): Promise<void> {
  const now = new Date().toISOString();
  const existing = await getDb()
    .select({ id: appPushDeviceTokens.id })
    .from(appPushDeviceTokens)
    .where(eq(appPushDeviceTokens.fcmToken, values.fcmToken))
    .limit(1);

  if (existing[0]) {
    await getDb()
      .update(appPushDeviceTokens)
      .set({
        platform: values.platform,
        citizenAccountId: values.citizenAccountId,
        deviceId: values.deviceId,
        updatedAt: now,
      })
      .where(eq(appPushDeviceTokens.id, existing[0].id));
    return;
  }

  await getDb().insert(appPushDeviceTokens).values({
    fcmToken: values.fcmToken,
    platform: values.platform,
    citizenAccountId: values.citizenAccountId,
    deviceId: values.deviceId,
    createdAt: now,
    updatedAt: now,
  });
}

export async function deleteAppPushDeviceToken(fcmToken: string): Promise<void> {
  await getDb().delete(appPushDeviceTokens).where(eq(appPushDeviceTokens.fcmToken, fcmToken));
}

export async function deleteFcmTokensByValues(tokens: string[]): Promise<void> {
  if (tokens.length === 0) return;
  await getDb().delete(appPushDeviceTokens).where(inArray(appPushDeviceTokens.fcmToken, tokens));
}
