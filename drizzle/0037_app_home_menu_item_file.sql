ALTER TYPE "file_category" ADD VALUE 'app_home_menu_document';
ALTER TYPE "app_home_item_kind" ADD VALUE 'file';
ALTER TABLE "app_mobile_home_items" ADD COLUMN "document_file_id" uuid;
ALTER TABLE "app_mobile_home_items" ADD CONSTRAINT "app_mobile_home_items_document_file_id_files_id_fk" FOREIGN KEY ("document_file_id") REFERENCES "public"."files"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
