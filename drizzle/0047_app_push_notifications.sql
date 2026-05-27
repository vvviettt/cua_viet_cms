ALTER TABLE "app_mobile_settings" ADD COLUMN "push_notifications_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE TYPE "public"."app_push_platform" AS ENUM('android', 'ios');--> statement-breakpoint
CREATE TABLE "app_push_device_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fcm_token" text NOT NULL,
	"platform" "app_push_platform" NOT NULL,
	"citizen_account_id" uuid,
	"device_id" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "app_push_device_tokens_fcm_token_unique" UNIQUE("fcm_token")
);
--> statement-breakpoint
ALTER TABLE "app_push_device_tokens" ADD CONSTRAINT "app_push_device_tokens_citizen_account_id_citizen_accounts_id_fk" FOREIGN KEY ("citizen_account_id") REFERENCES "public"."citizen_accounts"("id") ON DELETE set null ON UPDATE no action;
