CREATE TABLE "app_mobile_rss_feeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"feed_url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
INSERT INTO "app_mobile_rss_feeds" ("label", "feed_url", "sort_order", "is_active", "created_at", "updated_at")
SELECT 'Tin tức – Sự kiện', 'https://mst.gov.vn/rss/tin-tuc-su-kien.rss', 0, true, NOW()::text, NOW()::text
WHERE NOT EXISTS (SELECT 1 FROM "app_mobile_rss_feeds");
