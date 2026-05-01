DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'user_module_permissions'
			AND column_name = 'can_read'
			AND data_type IN ('smallint', 'integer', 'bigint')
	) THEN
		ALTER TABLE "user_module_permissions" ALTER COLUMN "can_read" DROP DEFAULT;
		ALTER TABLE "user_module_permissions" ALTER COLUMN "can_read" TYPE boolean USING ("can_read" <> 0);
		ALTER TABLE "user_module_permissions" ALTER COLUMN "can_read" SET DEFAULT false;
		ALTER TABLE "user_module_permissions" ALTER COLUMN "can_read" SET NOT NULL;
	END IF;
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'user_module_permissions'
			AND column_name = 'can_edit'
			AND data_type IN ('smallint', 'integer', 'bigint')
	) THEN
		ALTER TABLE "user_module_permissions" ALTER COLUMN "can_edit" DROP DEFAULT;
		ALTER TABLE "user_module_permissions" ALTER COLUMN "can_edit" TYPE boolean USING ("can_edit" <> 0);
		ALTER TABLE "user_module_permissions" ALTER COLUMN "can_edit" SET DEFAULT false;
		ALTER TABLE "user_module_permissions" ALTER COLUMN "can_edit" SET NOT NULL;
	END IF;
END $$;
