/**
 * DailyQuoteService — orchestrates weather-aware daily quote selection.
 *
 * Determinism contract:
 * - Same subscriptionId + same servedDate → always returns the same primary quote.
 * - Anonymous users (no subscriptionId) → deterministic by date + toneId hash.
 * - 30-day no-repeat window enforced when subscriptionId is provided.
 */
import { and, eq } from "drizzle-orm";
import { db, deliveryLog, quotes } from "@dawncast/db";
import {
  selectQuote,
  fetchFallbackQuote,
  getRecentlyServedIds,
  recordDelivery,
} from "./quote-service";
import type { WeatherResult } from "./weather-service";

export interface DailyQuoteResult {
  id: string;
  text: string;
  author: string;
  isPrimary: boolean;
  servedDate: string;
}

/** Get today's date string in YYYY-MM-DD format (UTC). */
export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Return the primary daily quote for a user.
 * If the user already received a quote today (via subscriptionId), return the same one.
 * Otherwise, select a new one, record it, and return it.
 */
export async function getDailyQuote(params: {
  subscriptionId?: string | null;
  weather: WeatherResult;
  language?: string;
}): Promise<DailyQuoteResult> {
  const { subscriptionId, weather, language = "en" } = params;
  const servedDate = getTodayDateString();

  // If we have a subscription, check if today's primary quote is already logged
  if (subscriptionId) {
    const rows = await db
      .select({
        id: quotes.id,
        text: quotes.text,
        author: quotes.author,
      })
      .from(deliveryLog)
      .innerJoin(quotes, eq(deliveryLog.quoteId, quotes.id))
      .where(
        and(
          eq(deliveryLog.subscriptionId, subscriptionId),
          eq(deliveryLog.servedDate, servedDate),
          eq(deliveryLog.isBonus, false),
        ),
      )
      .limit(1);

    const existing = rows[0];
    if (existing) {
      return {
        id: existing.id,
        text: existing.text,
        author: existing.author,
        isPrimary: true,
        servedDate,
      };
    }
  }

  // Select a new quote
  const excludeIds = await getRecentlyServedIds(subscriptionId ?? null);
  const seed = `${servedDate}:${weather.toneId}:${subscriptionId ?? "anon"}`;

  let quote = await selectQuote({
    toneId: weather.toneId,
    language,
    excludeIds,
    seed,
  });

  if (!quote) {
    console.warn(
      `[daily-quote] No DB quotes for tone=${weather.toneId}; using ZenQuotes fallback.`,
    );
    quote = await fetchFallbackQuote();
  }

  // Record delivery (only if we have a subscriptionId and it's not a fallback)
  if (subscriptionId && quote.id !== "fallback") {
    await recordDelivery({
      subscriptionId,
      quoteId: quote.id,
      servedDate,
      weatherCode: weather.weatherCode,
      temperatureCelsius: weather.temperatureCelsius,
      toneCategoryId: weather.toneId,
      isBonus: false,
    });
  }

  return {
    id: quote.id,
    text: quote.text,
    author: quote.author,
    isPrimary: true,
    servedDate,
  };
}

/**
 * Return a bonus quote — different from today's primary quote.
 * Does NOT replace or update the primary quote in the delivery log.
 */
export async function getBonusQuote(params: {
  subscriptionId?: string | null;
  weather: WeatherResult;
  language?: string;
}): Promise<DailyQuoteResult> {
  const { subscriptionId, weather, language = "en" } = params;
  const servedDate = getTodayDateString();

  // Exclude everything served in the last 30 days PLUS today's primary
  const excludeIds = await getRecentlyServedIds(subscriptionId ?? null);

  // Use a different seed from the primary so it selects a different quote
  const seed = `${servedDate}:${weather.toneId}:${subscriptionId ?? "anon"}:bonus:${Date.now()}`;

  let quote = await selectQuote({
    toneId: weather.toneId,
    language,
    excludeIds,
    seed,
  });

  if (!quote) {
    quote = await fetchFallbackQuote();
  }

  // Record as bonus delivery
  if (subscriptionId && quote.id !== "fallback") {
    await recordDelivery({
      subscriptionId,
      quoteId: quote.id,
      servedDate,
      weatherCode: weather.weatherCode,
      temperatureCelsius: weather.temperatureCelsius,
      toneCategoryId: weather.toneId,
      isBonus: true,
    });
  }

  return {
    id: quote.id,
    text: quote.text,
    author: quote.author,
    isPrimary: false,
    servedDate,
  };
}
