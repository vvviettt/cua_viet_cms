import { unlink } from "fs/promises";
import path from "path";
import { and, eq, like, lt } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { deleteFileRecordById } from "@/lib/db/file-records";
import { files, newsArticles } from "@/lib/db/schema";
import { NEWS_CONTENT_IMAGE_RELATIVE_PREFIX } from "@/lib/news/save-content-image";
import { uploadsPublicHref } from "@/lib/uploads/public-url";

const MS_PER_DAY = 86_400_000;

export type CleanupOrphanNewsContentImagesResult = {
  /** Số file đã xóa (đĩa + bản ghi). */
  deletedCount: number;
  /** Thời điểm cắt: chỉ xét file tạo trước mốc này (UTC ISO). */
  cutoffIso: string;
  errors: string[];
};

function mergedNewsContentAndBanners(): Promise<{ contentBlob: string; bannerIds: Set<string> }> {
  return getDb()
    .select({
      contentJson: newsArticles.contentJson,
      bannerFileId: newsArticles.bannerFileId,
    })
    .from(newsArticles)
    .then((rows) => {
      const bannerIds = new Set(rows.map((r) => r.bannerFileId));
      const contentBlob = rows.map((r) => r.contentJson).join("\n");
      return { contentBlob, bannerIds };
    });
}

function isReferencedByNews(params: {
  fileId: string;
  relativePath: string;
  bannerIds: Set<string>;
  contentBlob: string;
}): boolean {
  if (params.bannerIds.has(params.fileId)) return true;
  const { contentBlob, relativePath } = params;
  if (contentBlob.includes(relativePath)) return true;
  if (contentBlob.includes(uploadsPublicHref(relativePath))) return true;
  if (contentBlob.includes(`/uploads/${relativePath}`)) return true;
  return false;
}

/**
 * Xóa ảnh nội dung tin (`tin-tuc/noi-dung`) không còn được dùng trong bài viết,
 * chỉ khi file đã tạo trước `minAgeMs` ms (mặc định 24h).
 */
export async function cleanupOrphanNewsContentImages(options?: {
  /** Tuổi tối thiểu của file (ms) trước khi được xóa. Mặc định 24 giờ. */
  minAgeMs?: number;
  now?: Date;
}): Promise<CleanupOrphanNewsContentImagesResult> {
  const minAgeMs = options?.minAgeMs ?? MS_PER_DAY;
  const now = options?.now ?? new Date();
  const cutoff = new Date(now.getTime() - minAgeMs);
  const cutoffIso = cutoff.toISOString();

  const { contentBlob, bannerIds } = await mergedNewsContentAndBanners();

  const candidates = await getDb()
    .select()
    .from(files)
    .where(
      and(
        eq(files.category, "other"),
        like(files.relativePath, `${NEWS_CONTENT_IMAGE_RELATIVE_PREFIX}/%`),
        lt(files.createdAt, cutoffIso),
      ),
    );

  const errors: string[] = [];
  let deletedCount = 0;

  for (const row of candidates) {
    if (
      isReferencedByNews({
        fileId: row.id,
        relativePath: row.relativePath,
        bannerIds,
        contentBlob,
      })
    ) {
      continue;
    }

    const diskPath = path.join(process.cwd(), "public", "uploads", row.relativePath);
    let diskCleared = false;
    try {
      await unlink(diskPath);
      diskCleared = true;
    } catch (e) {
      const code = (e as NodeJS.ErrnoException).code;
      if (code === "ENOENT") {
        diskCleared = true;
      } else {
        errors.push(`${row.id}: unlink ${row.relativePath} — ${String(e)}`);
      }
    }

    if (!diskCleared) {
      continue;
    }

    try {
      await deleteFileRecordById(row.id);
      deletedCount += 1;
    } catch (e) {
      errors.push(`${row.id}: delete DB — ${String(e)}`);
    }
  }

  return { deletedCount, cutoffIso, errors };
}
