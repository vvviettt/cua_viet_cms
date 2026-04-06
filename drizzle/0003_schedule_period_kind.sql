CREATE TYPE "public"."schedule_period_kind" AS ENUM('week', 'month', 'year');--> statement-breakpoint
ALTER TABLE "work_schedules" ADD COLUMN "period_kind" "schedule_period_kind" DEFAULT 'week' NOT NULL;--> statement-breakpoint
ALTER TABLE "work_schedules" RENAME COLUMN "week_value" TO "period_value";--> statement-breakpoint
ALTER TABLE "work_schedules" DROP CONSTRAINT "work_schedules_type_id_week_value_unique";--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_type_id_period_kind_period_value_unique" UNIQUE("type_id","period_kind","period_value");
