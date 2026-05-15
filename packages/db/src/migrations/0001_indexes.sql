CREATE INDEX IF NOT EXISTS "quotes_tone_lang_active_idx" ON "quotes" ("tone_category_id", "language", "is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "delivery_log_sub_date_idx" ON "delivery_log" ("subscription_id", "served_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "weather_cache_location_expires_idx" ON "weather_cache" ("latitude", "longitude", "expires_at");
