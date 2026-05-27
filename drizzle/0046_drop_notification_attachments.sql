ALTER TABLE "app_mobile_notifications" DROP CONSTRAINT IF EXISTS "app_mobile_notifications_file_id_files_id_fk";--> statement-breakpoint
ALTER TABLE "app_mobile_notifications" DROP COLUMN IF EXISTS "attachment_kind";--> statement-breakpoint
ALTER TABLE "app_mobile_notifications" DROP COLUMN IF EXISTS "web_url";--> statement-breakpoint
ALTER TABLE "app_mobile_notifications" DROP COLUMN IF EXISTS "file_id";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."app_mobile_notification_attachment_kind";
