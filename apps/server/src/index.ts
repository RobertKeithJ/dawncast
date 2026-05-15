import { cors } from "@elysiajs/cors";
import { env } from "@project-dailyquotes/env/server";
import { Elysia, t } from "elysia";
import { db, quotes, pushSubscriptions } from "@project-dailyquotes/db";
import { eq, and, sql } from "drizzle-orm";
import { getToneForWeatherCode, getWeatherConditionLabel } from "./functions";
import {
  DEFAULT_QUOTE_TEXT,
  DEFAULT_QUOTE_AUTHOR,
  ZENQUOTES_API_URL,
  OPENMETEO_GEOCODING_API_URL,
  OPENMETEO_FORECAST_API_URL,
} from "./constants";

const app = new Elysia()
  .use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS"],
    }),
  )
  .get("/", () => "OK")
  .get(
    "/api/daily-quote",
    async ({ query }) => {
      let lat = query.lat ? parseFloat(query.lat) : null;
      let lon = query.lon ? parseFloat(query.lon) : null;
      let city = query.city || null;

      let weatherCode = 0; // default clear
      let temp = 25;

      if (city) {
        try {
          const geoRes = await fetch(`${OPENMETEO_GEOCODING_API_URL}?name=${encodeURIComponent(city)}&count=1`);
          if (geoRes.ok) {
            const geoData = await geoRes.json() as any;
            if (geoData.results && geoData.results.length > 0) {
              lat = geoData.results[0].latitude;
              lon = geoData.results[0].longitude;
            }
          }
        } catch (e) {
          console.error("Failed to geocode city", e);
        }
      }

      if (lat !== null && lon !== null) {
        try {
          const res = await fetch(`${OPENMETEO_FORECAST_API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
          if (res.ok) {
            const data = await res.json() as any;
            weatherCode = data.current.weather_code;
            temp = data.current.temperature_2m;
          }
        } catch (e) {
          console.error("Failed to fetch weather", e);
        }
      }

      const { toneId, toneLabel } = getToneForWeatherCode(weatherCode);
      const conditionLabel = getWeatherConditionLabel(weatherCode);

      let quoteText = DEFAULT_QUOTE_TEXT;
      let author = DEFAULT_QUOTE_AUTHOR;

      try {
        // Try to fetch from the database first based on the weather's toneId
        const dbQuotes = await db
          .select()
          .from(quotes)
          .where(
            and(
              eq(quotes.toneCategoryId, toneId),
              eq(quotes.isActive, true)
            )
          )
          .orderBy(sql`RANDOM()`)
          .limit(1);

        if (dbQuotes && dbQuotes.length > 0 && dbQuotes[0]) {
          quoteText = dbQuotes[0].text;
          author = dbQuotes[0].author;
        } else {
          // Graceful fallback to ZenQuotes if our database is empty or lacks this tone category
          const quoteRes = await fetch(ZENQUOTES_API_URL);
          if (quoteRes.ok) {
            const data = await quoteRes.json() as any;
            if (data && data.length > 0) {
              quoteText = data[0].q;
              author = data[0].a;
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch quote", e);
      }

      return {
        quote: {
          text: quoteText,
          author,
        },
        weather: {
          code: weatherCode,
          condition: conditionLabel,
          temp,
          toneId,
          toneLabel,
        }
      };
    },
    {
      query: t.Object({
        lat: t.Optional(t.String()),
        lon: t.Optional(t.String()),
        city: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/api/subscribe",
    async ({ body }) => {
      try {
        await db.insert(pushSubscriptions)
          .values({
            endpoint: body.endpoint,
            p256dh: body.keys.p256dh,
            auth: body.keys.auth,
          })
          .onConflictDoUpdate({
            target: pushSubscriptions.endpoint,
            set: {
              p256dh: body.keys.p256dh,
              auth: body.keys.auth,
              isActive: true,
              updatedAt: new Date()
            }
          });
        return { success: true };
      } catch (error) {
        console.error("Failed to save push subscription", error);
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
      })
    }
  );

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});

export type App = typeof app;
