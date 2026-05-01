ALTER TYPE "app_home_banner_item_kind" ADD VALUE 'file';
--> statement-breakpoint
ALTER TABLE "app_mobile_home_banner_sections" ADD COLUMN IF NOT EXISTS "document_file_id" uuid;
--> statement-breakpoint
ALTER TABLE "app_mobile_home_banner_sections" ADD CONSTRAINT "app_mobile_home_banner_sections_document_file_id_files_id_fk" FOREIGN KEY ("document_file_id") REFERENCES "public"."files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
