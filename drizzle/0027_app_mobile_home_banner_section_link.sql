ALTER TABLE "app_mobile_home_banner_sections" ADD COLUMN IF NOT EXISTS "kind" "app_home_item_kind" NOT NULL DEFAULT 'native';
ALTER TABLE "app_mobile_home_banner_sections" ADD COLUMN IF NOT EXISTS "route_id" text;
ALTER TABLE "app_mobile_home_banner_sections" ADD COLUMN IF NOT EXISTS "web_url" text;

