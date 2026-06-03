CREATE UNIQUE INDEX IF NOT EXISTS "citizen_accounts_cccd_unique"
  ON "citizen_accounts" ("cccd")
  WHERE "cccd" IS NOT NULL;
