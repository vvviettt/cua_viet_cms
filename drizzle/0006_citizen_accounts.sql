CREATE TABLE "citizen_accounts" (
	"phone" text PRIMARY KEY NOT NULL,
	"email" text,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"address" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "citizen_accounts_email_unique" UNIQUE("email")
);
