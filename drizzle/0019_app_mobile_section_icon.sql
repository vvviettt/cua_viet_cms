ALTER TABLE "app_mobile_home_sections" ADD COLUMN "icon_file_id" uuid;--> statement-breakpoint
ALTER TABLE "app_mobile_home_sections" ADD CONSTRAINT "app_mobile_home_sections_icon_file_id_files_id_fk" FOREIGN KEY ("icon_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;

