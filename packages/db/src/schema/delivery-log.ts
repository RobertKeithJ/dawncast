// schema/delivery-log.ts
// Owns: record of which quote was served per subscription per day
// Handles: 30-day dedup logic, notification delivery receipts, history reconstruction

import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { pushSubscriptions } from "./subscriptions";
import { quotes } from "./quotes";

export const deliveryLog = pgTable(
  "delivery_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Who got what
    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => pushSubscriptions.id, { onDelete: "cascade" }),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id),

    // When and under what conditions
    servedDate: text("served_date").notNull(), // YYYY-MM-DD in user's local timezone
    weatherCode: integer("weather_code").notNull(),
    temperatureCelsius: doublePrecision("temperature_celsius"),
    toneCategoryId: text("tone_category_id").notNull(),
    isBonus: boolean("is_bonus").notNull().default(false),

    // Notification delivery status
    notificationSent: boolean("notification_sent").notNull().default(false),
    notificationSentAt: timestamp("notification_sent_at", { withTimezone: true }),
    notificationError: text("notification_error"), // failure reason if push failed

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("delivery_log_sub_date_idx").on(table.subscriptionId, table.servedDate),
  ],
);

export type DeliveryLog = typeof deliveryLog.$inferSelect;
export type NewDeliveryLog = typeof deliveryLog.$inferInsert;
