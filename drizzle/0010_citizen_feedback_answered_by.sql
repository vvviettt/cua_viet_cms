ALTER TABLE "citizen_feedback" ADD COLUMN "answered_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "citizen_feedback" ADD CONSTRAINT "citizen_feedback_answered_by_user_id_users_id_fk" FOREIGN KEY ("answered_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
