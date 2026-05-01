ALTER TYPE "public"."app_home_item_kind" ADD VALUE 'word_doc';
ALTER TYPE "public"."app_home_item_kind" ADD VALUE 'article';
--> statement-breakpoint
ALTER TABLE "app_mobile_home_banner_items" ADD COLUMN "word_file_id" uuid;
--> statement-breakpoint
ALTER TABLE "app_mobile_home_banner_items" ADD COLUMN "article_title" text;
--> statement-breakpoint
ALTER TABLE "app_mobile_home_banner_items" ADD COLUMN "article_body_json" text DEFAULT '{"blocks":[]}' NOT NULL;
--> statement-breakpoint
ALTER TABLE "app_mobile_home_banner_items" ADD CONSTRAINT "app_mobile_home_banner_items_word_file_id_files_id_fk" FOREIGN KEY ("word_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
