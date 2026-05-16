// schema/quotes.ts
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const languageEnum = pgEnum("language", ["en", "fil"]);

export const toneCategories = pgTable("tone_categories", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  description: text("description"),
  weatherCodes: jsonb("weather_codes").$type<number[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    text: text("text").notNull(),
    author: text("author").notNull().default("Unknown"),
    toneCategoryId: text("tone_category_id")
      .notNull()
      .references(() => toneCategories.id),
    language: languageEnum("language").notNull().default("en"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("quotes_tone_lang_active_idx").on(
      table.toneCategoryId,
      table.language,
      table.isActive,
    ),
  ],
);

export type ToneCategory = typeof toneCategories.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
