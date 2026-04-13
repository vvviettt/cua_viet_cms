CREATE TYPE "public"."app_home_banner_placement" AS ENUM('top', 'after_section_2');--> statement-breakpoint
CREATE TYPE "public"."app_home_item_kind" AS ENUM('native', 'webview');--> statement-breakpoint
CREATE TYPE "public"."citizen_feedback_kind" AS ENUM('phan_anh', 'kien_nghi');--> statement-breakpoint
CREATE TYPE "public"."citizen_feedback_status" AS ENUM('received', 'processing', 'answered', 'closed');--> statement-breakpoint
CREATE TYPE "public"."schedule_period_kind" AS ENUM('week', 'month', 'year');--> statement-breakpoint
ALTER TYPE "public"."file_category" ADD VALUE 'news_banner';--> statement-breakpoint
ALTER TYPE "public"."file_category" ADD VALUE 'app_home_banner';--> statement-breakpoint
ALTER TYPE "public"."file_category" ADD VALUE 'app_home_icon';--> statement-breakpoint
CREATE TABLE "app_mobile_banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"placement" "app_home_banner_placement" DEFAULT 'top' NOT NULL,
	"redirect_url" text,
	"route_path" text,
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
	"icon_file_id" uuid,
	"accent_hex" text DEFAULT '#1565C0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_mobile_home_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"icon_file_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_mobile_theme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"primary_seed_hex" text DEFAULT '#0D47A1' NOT NULL,
	"home_hero_title" text DEFAULT 'Chuyên trang chuyển đổi số
Xã Cửa Việt' NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "citizen_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"address" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "citizen_accounts_phone_unique" UNIQUE("phone"),
	CONSTRAINT "citizen_accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "citizen_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "citizen_feedback_kind" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"citizen_account_id" uuid NOT NULL,
	"status" "citizen_feedback_status" DEFAULT 'received' NOT NULL,
	"answered_by_user_id" uuid,
	"staff_reply" text,
	"admin_note" text,
	"hidden_from_app" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_article_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category_id" uuid NOT NULL,
	"banner_file_id" uuid NOT NULL,
	"content_json" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_service_hotlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_name" text NOT NULL,
	"phone" text NOT NULL,
	"note" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_member_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"citizen_account_id" uuid NOT NULL,
	"staff_member_id" uuid NOT NULL,
	"stars" integer NOT NULL,
	"detail" text,
	"month_key" text NOT NULL,
	"created_at" text NOT NULL,
	CONSTRAINT "staff_member_ratings_unique_per_month" UNIQUE("citizen_account_id","staff_member_id","month_key")
);
--> statement-breakpoint
CREATE TABLE "staff_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"date_of_birth" date,
	"job_title" text NOT NULL,
	"avatar_relative_path" text,
	"contact_email" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "work_schedules" RENAME COLUMN "week_value" TO "period_value";--> statement-breakpoint
ALTER TABLE "work_schedules" DROP CONSTRAINT "work_schedules_type_id_week_value_unique";--> statement-breakpoint
ALTER TABLE "work_schedules" ADD COLUMN "period_kind" "schedule_period_kind" DEFAULT 'week' NOT NULL;--> statement-breakpoint
ALTER TABLE "app_mobile_banners" ADD CONSTRAINT "app_mobile_banners_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_mobile_home_items" ADD CONSTRAINT "app_mobile_home_items_section_id_app_mobile_home_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."app_mobile_home_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_mobile_home_items" ADD CONSTRAINT "app_mobile_home_items_icon_file_id_files_id_fk" FOREIGN KEY ("icon_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_mobile_home_sections" ADD CONSTRAINT "app_mobile_home_sections_icon_file_id_files_id_fk" FOREIGN KEY ("icon_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_feedback" ADD CONSTRAINT "citizen_feedback_citizen_account_id_citizen_accounts_id_fk" FOREIGN KEY ("citizen_account_id") REFERENCES "public"."citizen_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_feedback" ADD CONSTRAINT "citizen_feedback_answered_by_user_id_users_id_fk" FOREIGN KEY ("answered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_category_id_news_article_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."news_article_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_banner_file_id_files_id_fk" FOREIGN KEY ("banner_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_member_ratings" ADD CONSTRAINT "staff_member_ratings_citizen_account_id_citizen_accounts_id_fk" FOREIGN KEY ("citizen_account_id") REFERENCES "public"."citizen_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_member_ratings" ADD CONSTRAINT "staff_member_ratings_staff_member_id_staff_members_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_type_id_period_kind_period_value_unique" UNIQUE("type_id","period_kind","period_value");