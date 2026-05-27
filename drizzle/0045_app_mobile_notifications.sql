CREATE TYPE "public"."app_mobile_notification_category" AS ENUM('system', 'news', 'plan', 'event');--> statement-breakpoint
CREATE TYPE "public"."app_mobile_notification_attachment_kind" AS ENUM('none', 'web_link', 'file_word', 'file_docx', 'file_excel');--> statement-breakpoint
CREATE TABLE "app_mobile_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "app_mobile_notification_category" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"attachment_kind" "app_mobile_notification_attachment_kind" DEFAULT 'none' NOT NULL,
	"web_url" text,
	"file_id" uuid,
	"sent_at" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_mobile_notifications" ADD CONSTRAINT "app_mobile_notifications_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
