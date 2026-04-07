ALTER TYPE "public"."file_category" ADD VALUE 'news_banner';--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"banner_file_id" uuid NOT NULL,
	"content_json" text NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_banner_file_id_files_id_fk" FOREIGN KEY ("banner_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
