ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "users" SET "is_admin" = true WHERE "role"::text = 'admin';
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "role";
--> statement-breakpoint
DROP TYPE IF EXISTS "user_role";
