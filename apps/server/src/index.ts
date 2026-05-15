import { cors } from "@elysiajs/cors";
import { env } from "@project-dailyquotes/env/server";
import { Elysia, t } from "elysia";
import { db, quotes, pushSubscriptions } from "@project-dailyquotes/db";
import { eq, and, sql } from "drizzle-orm";

function getToneForWeatherCode(code: number): { toneId: string, toneLabel: string } {
  if (code === 0 || code === 1 || code === 2) {
    return { toneId: "energy_action", toneLabel: "Energy & Action" };
  } else if (code === 3) {
    return { toneId: "patience_perseverance", toneLabel: "Patience & Perseverance" };
  } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { toneId: "resilience_growth", toneLabel: "Resilience & Growth" };
  } else if (code >= 95 && code <= 99) {
    return { toneId: "courage_strength", toneLabel: "Courage & Strength" };
  } else if (code === 45 || code === 48) {
    return { toneId: "clarity_focus", toneLabel: "Clarity & Focus" };
  } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return { toneId: "rest_renewal", toneLabel: "Rest & Renewal" };
  }
  return { toneId: "general_motivation", toneLabel: "General Motivation" };
}

function getWeatherConditionLabel(code: number): string {
  const mapping: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return mapping[code] || "Unknown";
}

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
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
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
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
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

      let quoteText = "It always seems impossible until it's done.";
      let author = "Nelson Mandela";

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
          const quoteRes = await fetch("https://zenquotes.io/api/random");
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
