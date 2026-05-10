-- Bài viết (EditorJS) cho mục menu trang chủ app.
DO $$ BEGIN
  ALTER TYPE "app_home_item_kind" ADD VALUE 'article';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "app_mobile_home_items" ADD COLUMN IF NOT EXISTS "article_title" text;
ALTER TABLE "app_mobile_home_items" ADD COLUMN IF NOT EXISTS "article_body_json" text;

UPDATE "app_mobile_home_items"
SET "article_body_json" = '{"blocks":[]}'
WHERE "article_body_json" IS NULL;

ALTER TABLE "app_mobile_home_items"
  ALTER COLUMN "article_body_json" SET DEFAULT '{"blocks":[]}';
ALTER TABLE "app_mobile_home_items"
  ALTER COLUMN "article_body_json" SET NOT NULL;
