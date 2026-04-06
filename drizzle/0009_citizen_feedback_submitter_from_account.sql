DELETE FROM "citizen_feedback" WHERE "citizen_account_id" IS NULL;--> statement-breakpoint
ALTER TABLE "citizen_feedback" DROP COLUMN "submitter_name";--> statement-breakpoint
ALTER TABLE "citizen_feedback" DROP COLUMN "submitter_phone";--> statement-breakpoint
ALTER TABLE "citizen_feedback" DROP COLUMN "submitter_email";--> statement-breakpoint
ALTER TABLE "citizen_feedback" ALTER COLUMN "citizen_account_id" SET NOT NULL;
