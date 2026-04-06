ALTER TABLE "citizen_feedback" ADD COLUMN "citizen_account_phone" text;--> statement-breakpoint
ALTER TABLE "citizen_feedback" ADD CONSTRAINT "citizen_feedback_citizen_account_phone_citizen_accounts_phone_fk" FOREIGN KEY ("citizen_account_phone") REFERENCES "public"."citizen_accounts"("phone") ON DELETE no action ON UPDATE no action;
