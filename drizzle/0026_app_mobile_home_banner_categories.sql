CREATE TABLE IF NOT EXISTS "app_mobile_home_banner_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cta_key" "app_home_banner_cta_key" NOT NULL,
	"title" text NOT NULL,
	"icon_file_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "app_mobile_home_banner_sections" ADD CONSTRAINT "app_mobile_home_banner_sections_icon_file_id_fk"
 FOREIGN KEY ("icon_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "app_mobile_home_banner_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"kind" "app_home_item_kind" NOT NULL,
	"route_id" text,
	"web_url" text,
	"label" text NOT NULL,
	"icon_key" text DEFAULT 'help_outline' NOT NULL,
	"icon_file_id" uuid,
	"accent_hex" text DEFAULT '#1565C0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "app_mobile_home_banner_items" ADD CONSTRAINT "app_mobile_home_banner_items_section_id_fk"
 FOREIGN KEY ("section_id") REFERENCES "public"."app_mobile_home_banner_sections"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "app_mobile_home_banner_items" ADD CONSTRAINT "app_mobile_home_banner_items_icon_file_id_fk"
 FOREIGN KEY ("icon_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DROP TABLE IF EXISTS "app_mobile_home_banner_cta_sections";

