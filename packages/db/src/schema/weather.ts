// schema/weather.ts
// Owns: server-side weather fetch cache (reduces Open-Meteo calls per region)

import {
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const weatherCache = pgTable("weather_cache", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Location — rounded to 2 decimal places (~1.1km) to group nearby coordinates
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  cityName: text("city_name"), // nullable — populated from reverse geocode if available

  // Weather payload from Open-Meteo
  weatherCode: integer("weather_code").notNull(), // WMO code
  temperatureCelsius: doublePrecision("temperature_celsius").notNull(),
  conditionLabel: text("condition_label").notNull(), // e.g. "Moderate rain"

  // Derived tone (precomputed on insert — avoids re-mapping on every quote request)
  toneCategoryId: text("tone_category_id").notNull(),

  // Cache validity
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // fetchedAt + 60 min
});

export type WeatherCache = typeof weatherCache.$inferSelect;
export type NewWeatherCache = typeof weatherCache.$inferInsert;
