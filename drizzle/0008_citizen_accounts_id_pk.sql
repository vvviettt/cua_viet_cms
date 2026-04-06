ALTER TABLE "citizen_feedback" DROP CONSTRAINT IF EXISTS "citizen_feedback_citizen_account_phone_citizen_accounts_phone_fk";--> statement-breakpoint
ALTER TABLE "citizen_accounts" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "citizen_accounts" DROP CONSTRAINT "citizen_accounts_pkey";--> statement-breakpoint
ALTER TABLE "citizen_accounts" ADD CONSTRAINT "citizen_accounts_pkey" PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "citizen_accounts" ADD CONSTRAINT "citizen_accounts_phone_unique" UNIQUE ("phone");--> statement-breakpoint
ALTER TABLE "citizen_feedback" ADD COLUMN "citizen_account_id" uuid;--> statement-breakpoint
UPDATE "citizen_feedback" AS cf SET "citizen_account_id" = ca."id" FROM "citizen_accounts" AS ca WHERE cf."citizen_account_phone" IS NOT NULL AND cf."citizen_account_phone" = ca."phone";--> statement-breakpoint
ALTER TABLE "citizen_feedback" DROP COLUMN "citizen_account_phone";--> statement-breakpoint
ALTER TABLE "citizen_feedback" ADD CONSTRAINT "citizen_feedback_citizen_account_id_citizen_accounts_id_fk" FOREIGN KEY ("citizen_account_id") REFERENCES "public"."citizen_accounts"("id") ON DELETE no action ON UPDATE no action;
