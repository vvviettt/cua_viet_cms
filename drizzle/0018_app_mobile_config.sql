CREATE TYPE "public"."app_home_item_kind" AS ENUM('native', 'webview');--> statement-breakpoint
ALTER TYPE "public"."file_category" ADD VALUE 'app_home_banner';--> statement-breakpoint
CREATE TABLE "app_mobile_theme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary_seed_hex" text DEFAULT '#0D47A1' NOT NULL,
	"home_hero_title" text DEFAULT 'Chuyên trang chuyển đổi số\nXã Cửa Việt' NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_mobile_home_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_mobile_home_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"kind" "app_home_item_kind" NOT NULL,
	"route_id" text,
	"web_url" text,
	"label" text NOT NULL,
	"icon_key" text DEFAULT 'help_outline' NOT NULL,
	"accent_hex" text DEFAULT '#1565C0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_mobile_banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_mobile_home_items" ADD CONSTRAINT "app_mobile_home_items_section_id_app_mobile_home_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."app_mobile_home_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_mobile_banners" ADD CONSTRAINT "app_mobile_banners_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;
