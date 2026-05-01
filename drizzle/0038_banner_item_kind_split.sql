CREATE TYPE "app_home_banner_item_kind" AS ENUM ('native', 'webview');
ALTER TABLE "app_mobile_home_banner_sections"
  ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "app_mobile_home_banner_sections"
  ALTER COLUMN "kind" TYPE "app_home_banner_item_kind"
  USING ("kind"::text::"app_home_banner_item_kind");
ALTER TABLE "app_mobile_home_banner_sections"
  ALTER COLUMN "kind" SET DEFAULT 'native'::"app_home_banner_item_kind";
ALTER TABLE "app_mobile_home_banner_items"
  ALTER COLUMN "kind" TYPE "app_home_banner_item_kind"
  USING ("kind"::text::"app_home_banner_item_kind");
