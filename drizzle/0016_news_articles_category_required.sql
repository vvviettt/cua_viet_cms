-- Đảm bảo có ít nhất một danh mục để gán cho bài đang thiếu (tránh subquery rỗng).
INSERT INTO "news_article_categories" ("title", "sort_order", "created_at", "updated_at")
SELECT 'CHƯA PHÂN LOẠI', 0, now()::text, now()::text
WHERE NOT EXISTS (SELECT 1 FROM "news_article_categories" LIMIT 1);
--> statement-breakpoint
-- Gán danh mục mặc định cho bài chưa có.
UPDATE "news_articles"
SET "category_id" = (
  SELECT "id" FROM "news_article_categories" ORDER BY "sort_order" ASC, "title" ASC LIMIT 1
)
WHERE "category_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "news_articles" DROP CONSTRAINT IF EXISTS "news_articles_category_id_news_article_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "news_articles" ALTER COLUMN "category_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_category_id_news_article_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."news_article_categories"("id") ON DELETE restrict ON UPDATE no action;
