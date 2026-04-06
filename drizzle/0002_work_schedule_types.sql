CREATE TABLE "work_schedule_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "work_schedule_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
INSERT INTO "work_schedule_types" ("code", "label", "sort_order", "is_active", "created_at", "updated_at") VALUES
	('hdnd_ubnd_lam_viec', 'Lịch làm việc HDND-UBND', 1, true, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
	('hdnd_ubnd_tiep_dan', 'Lịch tiếp dân HĐND-UBND', 2, true, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
--> statement-breakpoint
ALTER TABLE "work_schedules" DROP CONSTRAINT "work_schedules_week_value_unique";--> statement-breakpoint
ALTER TABLE "work_schedules" ADD COLUMN "type_id" uuid;--> statement-breakpoint
UPDATE "work_schedules" SET "type_id" = (SELECT "id" FROM "work_schedule_types" WHERE "code" = 'hdnd_ubnd_lam_viec' LIMIT 1) WHERE "type_id" IS NULL;--> statement-breakpoint
ALTER TABLE "work_schedules" ALTER COLUMN "type_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_type_id_work_schedule_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."work_schedule_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_type_id_week_value_unique" UNIQUE("type_id","week_value");
