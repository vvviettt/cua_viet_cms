CREATE TABLE IF NOT EXISTS "user_module_permissions" (
	"user_id" uuid NOT NULL,
	"module_key" text NOT NULL,
	"can_read" boolean DEFAULT false NOT NULL,
	"can_edit" boolean DEFAULT false NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "user_module_permissions_user_module_unique" UNIQUE("user_id","module_key")
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint c
		JOIN pg_class t ON t.oid = c.conrelid
		WHERE t.relname = 'user_module_permissions'
			AND c.conname = 'user_module_permissions_user_id_users_id_fk'
	) THEN
		ALTER TABLE "user_module_permissions" ADD CONSTRAINT "user_module_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
