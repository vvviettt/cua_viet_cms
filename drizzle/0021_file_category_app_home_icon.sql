DO $$ BEGIN
  ALTER TYPE "public"."file_category" ADD VALUE IF NOT EXISTS 'app_home_icon';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

