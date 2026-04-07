CREATE TABLE "news_article_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "news_articles" ADD COLUMN "category_id" uuid;
--> statement-breakpoint
ALTER TABLE "news_articles" ADD CONSTRAINT "news_articles_category_id_news_article_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."news_article_categories"("id") ON DELETE set null ON UPDATE no action;
