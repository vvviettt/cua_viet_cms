DO $$ BEGIN
 CREATE TYPE "public"."app_home_banner_cta_key" AS ENUM('apply_online','lookup_result');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "app_mobile_home_banner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL DEFAULT 'CỬA VIỆT SỐ',
	"subtitle" text NOT NULL DEFAULT 'CHUYỂN ĐỔI SỐ XÃ CỬA VIỆT',
	"apply_label" text NOT NULL DEFAULT 'Nộp hồ sơ trực tuyến',
	"lookup_label" text NOT NULL DEFAULT 'Tra cứu kết quả',
	"updated_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "app_mobile_home_banner_cta_sections" (
	"cta_key" "app_home_banner_cta_key" NOT NULL,
	"section_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "app_mobile_home_banner_cta_sections_unique" UNIQUE("cta_key","section_id")
);

DO $$ BEGIN
 ALTER TABLE "app_mobile_home_banner_cta_sections" ADD CONSTRAINT "app_mobile_home_banner_cta_sections_section_id_fk"
 FOREIGN KEY ("section_id") REFERENCES "public"."app_mobile_home_sections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

