import { eq } from "drizzle-orm";
import { CMS_MODULE_KEYS, type CmsModuleKey } from "@/lib/cms-modules";
import { getDb } from "@/lib/db";
import { userModulePermissions } from "@/lib/db/schema";

export type UserModulePermissionRow = {
  moduleKey: CmsModuleKey;
  canRead: boolean;
  canEdit: boolean;
};

function pgErrorCode(err: unknown): string | undefined {
  const c =
    err && typeof err === "object" && "cause" in err ? (err as { cause?: unknown }).cause : undefined;
  if (c && typeof c === "object" && "code" in c && typeof (c as { code: unknown }).code === "string") {
    return (c as { code: string }).code;
  }
  return undefined;
}

function pgErrorDetail(err: unknown): string {
  const c =
    err && typeof err === "object" && "cause" in err ? (err as { cause?: unknown }).cause : undefined;
  if (c && typeof c === "object" && "message" in c) {
    return String((c as { message: unknown }).message);
  }
  return "";
}

function rethrowUserModuleTableError(err: unknown): never {
  const code = pgErrorCode(err);
  const detail = pgErrorDetail(err);
  if (code === "42P01") {
    throw new Error(
      `Thiếu bảng user_module_permissions (${detail}). Chạy npm run db:migrate với đúng DATABASE_URL mà next dev đang dùng (.env / .env.local).`,
      { cause: err },
    );
  }
  if (code === "42703" && detail.includes("updated_at")) {
    throw new Error(
      `Bảng user_module_permissions thiếu cột updated_at (${detail}). Chạy npm run db:migrate để áp migration 0034.`,
      { cause: err },
    );
  }
  if (code === "22P02" && detail.includes("false")) {
    throw new Error(
      `Cột can_read / can_edit đang là kiểu số trong DB nhưng app cần boolean. Chạy npm run db:migrate để áp migration 0035.`,
      { cause: err },
    );
  }
  throw err;
}

export async function listPermissionsByUserId(userId: string): Promise<UserModulePermissionRow[]> {
  let rows;
  try {
    rows = await getDb()
      .select()
      .from(userModulePermissions)
      .where(eq(userModulePermissions.userId, userId));
  } catch (e) {
    rethrowUserModuleTableError(e);
  }

  const map = new Map(rows.map((r) => [r.moduleKey, r]));

  return CMS_MODULE_KEYS.map((key) => {
    const r = map.get(key);
    return {
      moduleKey: key,
      canRead: r?.canRead ?? false,
      canEdit: r?.canEdit ?? false,
    };
  });
}

export async function replaceAllPermissionsForUser(
  userId: string,
  entries: Array<{ moduleKey: CmsModuleKey; canRead: boolean; canEdit: boolean }>,
): Promise<void> {
  const now = new Date().toISOString();
  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      await tx.delete(userModulePermissions).where(eq(userModulePermissions.userId, userId));
      const toInsert = entries
        .map((e) => ({
          userId,
          moduleKey: e.moduleKey,
          canRead: e.canRead,
          canEdit: e.canEdit,
          updatedAt: now,
        }))
        .filter((e) => e.canRead || e.canEdit);
      if (toInsert.length > 0) {
        await tx.insert(userModulePermissions).values(toInsert);
      }
    });
  } catch (e) {
    rethrowUserModuleTableError(e);
  }
}
