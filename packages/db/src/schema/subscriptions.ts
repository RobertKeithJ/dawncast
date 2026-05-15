// schema/subscriptions.ts
// Owns: Web Push subscription records (server-side only concern)

import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Web Push API subscription object fields
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),  // Public key
  auth: text("auth").notNull(),        // Auth secret

  // Delivery preferences
  notifyAt: text("notify_at").notNull().default("08:00"), // HH:MM local time
  timezone: text("timezone").notNull().default("Asia/Manila"),
  isActive: boolean("is_active").notNull().default(true),

  // Tracking
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
  failureCount: integer("failure_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
