ALTER TABLE "app_mobile_home_items"
ADD COLUMN "icon_file_id" uuid REFERENCES "files"("id") ON DELETE SET NULL;

