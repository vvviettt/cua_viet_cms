CREATE TYPE "public"."citizen_feedback_kind" AS ENUM('phan_anh', 'kien_nghi');--> statement-breakpoint
CREATE TYPE "public"."citizen_feedback_status" AS ENUM('received', 'processing', 'answered', 'closed');--> statement-breakpoint
CREATE TABLE "citizen_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "citizen_feedback_kind" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"submitter_name" text NOT NULL,
	"submitter_phone" text,
	"submitter_email" text,
	"status" "citizen_feedback_status" DEFAULT 'received' NOT NULL,
	"admin_note" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
