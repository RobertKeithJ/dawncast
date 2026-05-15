// schema/quotes.ts
// Owns: quote content, tone categories, and their relationship

import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const languageEnum = pgEnum("language", ["en", "fil"]);

export const toneCategories = pgTable("tone_categories", {
  id: text("id").primaryKey(), // human-readable slug: "resilience_growth"
  label: text("label").notNull(), // display: "Resilience & Growth"
  description: text("description"),
  weatherCodes: jsonb("weather_codes").$type<number[]>().notNull(), // WMO codes mapped to this tone
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  author: text("author").notNull().default("Unknown"),
  toneCategoryId: text("tone_category_id")
    .notNull()
    .references(() => toneCategories.id),
  language: languageEnum("language").notNull().default("en"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ToneCategory = typeof toneCategories.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
