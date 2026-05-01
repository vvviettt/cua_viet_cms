ALTER TABLE "app_mobile_home_banner" ADD COLUMN IF NOT EXISTS "decoration_file_id" uuid;
--> statement-breakpoint
ALTER TABLE "app_mobile_home_banner" ADD CONSTRAINT "app_mobile_home_banner_decoration_file_id_files_id_fk" FOREIGN KEY ("decoration_file_id") REFERENCES "public"."files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
