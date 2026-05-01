ALTER TABLE "user_module_permissions" ADD COLUMN IF NOT EXISTS "updated_at" text;
--> statement-breakpoint
UPDATE "user_module_permissions" SET "updated_at" = '1970-01-01T00:00:00.000Z' WHERE "updated_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "user_module_permissions" ALTER COLUMN "updated_at" SET NOT NULL;
