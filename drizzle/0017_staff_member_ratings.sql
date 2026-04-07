CREATE TABLE "staff_member_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"citizen_account_id" uuid NOT NULL,
	"staff_member_id" uuid NOT NULL,
	"stars" integer NOT NULL,
	"detail" text,
	"month_key" text NOT NULL,
	"created_at" text NOT NULL
);

ALTER TABLE "staff_member_ratings" ADD CONSTRAINT "staff_member_ratings_citizen_account_id_fk" FOREIGN KEY ("citizen_account_id") REFERENCES "public"."citizen_accounts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "staff_member_ratings" ADD CONSTRAINT "staff_member_ratings_staff_member_id_fk" FOREIGN KEY ("staff_member_id") REFERENCES "public"."staff_members"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "staff_member_ratings" ADD CONSTRAINT "staff_member_ratings_stars_check" CHECK ("stars" >= 1 AND "stars" <= 5);

CREATE UNIQUE INDEX "staff_member_ratings_unique_per_month" ON "staff_member_ratings" USING btree ("citizen_account_id","staff_member_id","month_key");
