import { cors } from "@elysiajs/cors";
import { env } from "@dawncast/env/server";
import { Elysia, t } from "elysia";
import { db, pushSubscriptions } from "@dawncast/db";
import { eq } from "drizzle-orm";

import { resolveWeather } from "./services/weather-service";
import { getDailyQuote, getBonusQuote } from "./services/daily-quote-service";
import { getQuoteHistory } from "./services/quote-service";

const app = new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
    }),
  )
  // ── Health ─────────────────────────────────────────────────────
  .get("/", () => "OK")

  // ── Daily Quote ────────────────────────────────────────────────
  .get(
    "/api/daily-quote",
    async ({ query }) => {
      const lat = query.lat ? parseFloat(query.lat) : null;
      const lon = query.lon ? parseFloat(query.lon) : null;
      const city = query.city ?? null;
      const subscriptionId = query.subscriptionId ?? null;
      const language = query.language ?? "en";

      const weather = await resolveWeather({ lat, lon, city });

      const quote = await getDailyQuote({
        subscriptionId,
        weather,
        language,
      });

      return {
        quote: {
          id: quote.id,
          text: quote.text,
          author: quote.author,
        },
        weather: {
          code: weather.weatherCode,
          condition: weather.conditionLabel,
          temp: weather.temperatureCelsius,
          toneId: weather.toneId,
          toneLabel: weather.toneLabel,
        },
        meta: {
          isPrimary: quote.isPrimary,
          servedDate: quote.servedDate,
          fromWeatherCache: weather.fromCache,
        },
      };
    },
    {
      query: t.Object({
        lat: t.Optional(t.String()),
        lon: t.Optional(t.String()),
        city: t.Optional(t.String()),
        subscriptionId: t.Optional(t.String()),
        language: t.Optional(t.String()),
      }),
    },
  )

  // ── Bonus Quote ────────────────────────────────────────────────
  .post(
    "/api/quote/bonus",
    async ({ body }) => {
      const weather = await resolveWeather({
        lat: body.lat ?? null,
        lon: body.lon ?? null,
        city: body.city ?? null,
      });

      const quote = await getBonusQuote({
        subscriptionId: body.subscriptionId ?? null,
        weather,
        language: body.language ?? "en",
      });

      return {
        quote: {
          id: quote.id,
          text: quote.text,
          author: quote.author,
        },
        meta: {
          isPrimary: false,
          servedDate: quote.servedDate,
        },
      };
    },
    {
      body: t.Object({
        lat: t.Optional(t.Number()),
        lon: t.Optional(t.Number()),
        city: t.Optional(t.String()),
        subscriptionId: t.Optional(t.String()),
        language: t.Optional(t.String()),
      }),
    },
  )

  // ── Quote History ──────────────────────────────────────────────
  .get(
    "/api/quote/history",
    async ({ query }) => {
      const limit = query.limit ? parseInt(query.limit, 10) : 30;
      const entries = await getQuoteHistory(query.subscriptionId, limit);
      return { entries };
    },
    {
      query: t.Object({
        subscriptionId: t.String(),
        limit: t.Optional(t.String()),
      }),
    },
  )

  // ── Push Subscription ─────────────────────────────────────────
  .post(
    "/api/subscribe",
    async ({ body }) => {
      try {
        await db
          .insert(pushSubscriptions)
          .values({
            endpoint: body.endpoint,
            p256dh: body.keys.p256dh,
            auth: body.keys.auth,
            timezone: body.timezone ?? "Asia/Manila",
            notifyAt: body.notifyAt ?? "08:00",
          })
          .onConflictDoUpdate({
            target: pushSubscriptions.endpoint,
            set: {
              p256dh: body.keys.p256dh,
              auth: body.keys.auth,
              isActive: true,
              updatedAt: new Date(),
            },
          });

        // Return the subscription ID for the client to store
        const sub = await db
          .select({ id: pushSubscriptions.id })
          .from(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, body.endpoint))
          .limit(1);

        return { success: true, subscriptionId: sub[0]?.id ?? null };
      } catch (error) {
        console.error("[subscribe] Failed to save push subscription:", error);
        throw new Error("Subscription failed");
      }
    },
    {
      body: t.Object({
        endpoint: t.String(),
        keys: t.Object({
          p256dh: t.String(),
          auth: t.String(),
        }),
        timezone: t.Optional(t.String()),
        notifyAt: t.Optional(t.String()),
      }),
    },
  )

  // ── Unsubscribe ────────────────────────────────────────────────
  .post(
    "/api/unsubscribe",
    async ({ body }) => {
      await db
        .update(pushSubscriptions)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(pushSubscriptions.endpoint, body.endpoint));
      return { success: true };
    },
    {
      body: t.Object({
        endpoint: t.String(),
      }),
    },
  )

  // ── Preferences (read) ─────────────────────────────────────────
  .get(
    "/api/preferences",
    async ({ query }) => {
      const rows = await db
        .select({
          notifyAt: pushSubscriptions.notifyAt,
          timezone: pushSubscriptions.timezone,
          isActive: pushSubscriptions.isActive,
        })
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.id, query.subscriptionId))
        .limit(1);

      const prefs = rows[0];
      if (!prefs) {
        return {
          notifyAt: "08:00",
          timezone: "Asia/Manila",
          isActive: false,
        };
      }
      return prefs;
    },
    {
      query: t.Object({
        subscriptionId: t.String(),
      }),
    },
  )

  // ── Preferences (write) ────────────────────────────────────────
  .post(
    "/api/preferences",
    async ({ body }) => {
      const updates: Partial<{
        notifyAt: string;
        timezone: string;
        updatedAt: Date;
      }> = { updatedAt: new Date() };
      if (body.notifyAt) updates.notifyAt = body.notifyAt;
      if (body.timezone) updates.timezone = body.timezone;

      await db
        .update(pushSubscriptions)
        .set(updates)
        .where(eq(pushSubscriptions.id, body.subscriptionId));

      return { success: true };
    },
    {
      body: t.Object({
        subscriptionId: t.String(),
        notifyAt: t.Optional(t.String()),
        timezone: t.Optional(t.String()),
      }),
    },
  );

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export type App = typeof app;
