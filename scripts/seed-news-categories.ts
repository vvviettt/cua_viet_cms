import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db/index";
import { newsArticleCategories } from "../lib/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

/** Thứ tự và tiêu đề mặc định (đúng bố cục giao diện tham chiếu). */
const DEFAULT_CATEGORY_TITLES: string[] = [
  "THÔNG TIN HOẠT ĐỘNG",
  "AN TOÀN GIAO THÔNG",
  "HOẠT ĐỘNG ĐẢNG UỶ",
  "KINH TẾ - VĂN HOÁ - XÃ HỘI",
  "AN NINH - QUỐC PHÒNG",
  "CHUYỂN ĐỔI SỐ",
];

async function main() {
  const db = getDb();
  const now = new Date().toISOString();
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < DEFAULT_CATEGORY_TITLES.length; i++) {
    const title = DEFAULT_CATEGORY_TITLES[i]!;
    const sortOrder = (i + 1) * 10;
    const [existing] = await db
      .select({ id: newsArticleCategories.id })
      .from(newsArticleCategories)
      .where(eq(newsArticleCategories.title, title))
      .limit(1);

    if (existing) {
      skipped += 1;
      continue;
    }

    await db.insert(newsArticleCategories).values({
      title,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    });
    inserted += 1;
  }

  console.log(
    `Danh mục tin: đã thêm ${inserted}, bỏ qua (đã tồn tại cùng tiêu đề) ${skipped}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
