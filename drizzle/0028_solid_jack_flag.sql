CREATE TABLE "app_mobile_faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_mobile_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"allow_citizen_register" boolean DEFAULT true NOT NULL,
	"support_hotline" text,
	"usage_guide_json" text DEFAULT '{"blocks":[]}' NOT NULL,
	"terms_json" text DEFAULT '{"blocks":[]}' NOT NULL,
	"updated_at" text NOT NULL
);