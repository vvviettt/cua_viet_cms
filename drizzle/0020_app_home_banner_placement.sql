DO $$ BEGIN
 CREATE TYPE "public"."app_home_banner_placement" AS ENUM('top','after_section_2');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "app_mobile_banners" ADD COLUMN "placement" "app_home_banner_placement" DEFAULT 'top' NOT NULL;

