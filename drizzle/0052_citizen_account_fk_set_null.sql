ALTER TABLE "citizen_feedback" DROP CONSTRAINT IF EXISTS "citizen_feedback_citizen_account_id_citizen_accounts_id_fk";--> statement-breakpoint
ALTER TABLE "citizen_feedback" ALTER COLUMN "citizen_account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "citizen_feedback" ADD CONSTRAINT "citizen_feedback_citizen_account_id_citizen_accounts_id_fk" FOREIGN KEY ("citizen_account_id") REFERENCES "public"."citizen_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_member_ratings" DROP CONSTRAINT IF EXISTS "staff_member_ratings_citizen_account_id_citizen_accounts_id_fk";--> statement-breakpoint
ALTER TABLE "staff_member_ratings" DROP CONSTRAINT IF EXISTS "staff_member_ratings_citizen_account_id_fk";--> statement-breakpoint
ALTER TABLE "staff_member_ratings" ALTER COLUMN "citizen_account_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "staff_member_ratings" ADD CONSTRAINT "staff_member_ratings_citizen_account_id_citizen_accounts_id_fk" FOREIGN KEY ("citizen_account_id") REFERENCES "public"."citizen_accounts"("id") ON DELETE set null ON UPDATE no action;
