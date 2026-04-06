CREATE TABLE "work_schedules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"week_value" text NOT NULL,
	"title" text NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "work_schedules_week_value_unique" UNIQUE("week_value")
);
