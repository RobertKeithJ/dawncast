/**
 * QuoteService — deterministic quote selection with 30-day deduplication.
 */
import { and, eq, gte, inArray, not, sql } from "drizzle-orm";
import { db, quotes, deliveryLog } from "@dawncast/db";
import type { NewDeliveryLog } from "@dawncast/db";
import {
  ZENQUOTES_API_URL,
  DEFAULT_QUOTE_TEXT,
  DEFAULT_QUOTE_AUTHOR,
} from "../constants";
import type { ZenQuote } from "../types";

export interface QuoteResult {
  id: string;
  text: string;
  author: string;
}

export interface HistoryEntry {
  quoteId: string;
  quoteText: string;
  author: string;
  servedDate: string;
  weatherCondition: string;
  toneLabel: string;
  isBonus: boolean;
}

/**
 * Stable numeric hash of a string — used for deterministic daily selection.
 * Returns a non-negative 32-bit integer.
 */
function stableHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Fetch quote IDs delivered to a subscription in the last `windowDays` days.
 * Returns empty array if subscriptionId is null.
 */
export async function getRecentlyServedIds(
  subscriptionId: string | null,
  windowDays = 30,
): Promise<string[]> {
  if (!subscriptionId) return [];

  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const rows = await db
    .select({ quoteId: deliveryLog.quoteId })
    .from(deliveryLog)
    .where(
      and(
        eq(deliveryLog.subscriptionId, subscriptionId),
        gte(deliveryLog.createdAt, since),
      ),
    );

  return rows.map((r) => r.quoteId);
}

/**
 * Select a quote from the pool for a given tone.
 * Excludes `excludeIds` to enforce 30-day dedupe.
 * Uses deterministic index based on `seed` so the same user always gets
 * the same quote for a given day + tone combination.
 */
export async function selectQuote(params: {
  toneId: string;
  language?: string;
  excludeIds?: string[];
  seed: string;
}): Promise<QuoteResult | null> {
  const { toneId, language = "en", excludeIds = [], seed } = params;

  const whereClause =
    excludeIds.length > 0
      ? and(
          eq(quotes.toneCategoryId, toneId),
          eq(quotes.language, language as "en" | "fil"),
          eq(quotes.isActive, true),
          not(inArray(quotes.id, excludeIds)),
        )
      : and(
          eq(quotes.toneCategoryId, toneId),
          eq(quotes.language, language as "en" | "fil"),
          eq(quotes.isActive, true),
        );

  const pool = await db
    .select({ id: quotes.id, text: quotes.text, author: quotes.author })
    .from(quotes)
    .where(whereClause)
    .orderBy(quotes.createdAt); // stable order — no RANDOM()

  if (pool.length === 0) {
    // Pool exhausted — retry without exclusions (reset)
    if (excludeIds.length > 0) {
      console.warn(
        `[quote] Pool exhausted for tone=${toneId}; resetting 30-day window.`,
      );
      return selectQuote({ toneId, language, seed });
    }
    return null;
  }

  const idx = stableHash(seed) % pool.length;
  const chosen = pool[idx];
  if (!chosen) return null;
  return { id: chosen.id, text: chosen.text, author: chosen.author };
}

/** ZenQuotes fallback — only used when the DB has no quotes for a tone. */
export async function fetchFallbackQuote(): Promise<QuoteResult> {
  try {
    const res = await fetch(ZENQUOTES_API_URL);
    if (res.ok) {
      const data = (await res.json()) as ZenQuote[];
      const first = data?.[0];
      if (first) {
        return { id: "fallback", text: first.q, author: first.a };
      }
    }
  } catch (e) {
    console.error("[quote] ZenQuotes fallback failed:", e);
  }
  return {
    id: "fallback",
    text: DEFAULT_QUOTE_TEXT,
    author: DEFAULT_QUOTE_AUTHOR,
  };
}

/** Record a quote delivery in the delivery_log table. */
export async function recordDelivery(data: NewDeliveryLog): Promise<void> {
  try {
    await db.insert(deliveryLog).values(data);
  } catch (e) {
    // Non-critical — log and continue
    console.error("[quote] Failed to record delivery:", e);
  }
}

/** Get quote history for a subscription, newest first. */
export async function getQuoteHistory(
  subscriptionId: string,
  limit = 30,
): Promise<HistoryEntry[]> {
  const rows = await db
    .select({
      quoteId: deliveryLog.quoteId,
      quoteText: quotes.text,
      author: quotes.author,
      servedDate: deliveryLog.servedDate,
      toneCategoryId: deliveryLog.toneCategoryId,
      weatherCode: deliveryLog.weatherCode,
      isBonus: deliveryLog.isBonus,
    })
    .from(deliveryLog)
    .innerJoin(quotes, eq(deliveryLog.quoteId, quotes.id))
    .where(eq(deliveryLog.subscriptionId, subscriptionId))
    .orderBy(sql`${deliveryLog.servedDate} DESC, ${deliveryLog.createdAt} DESC`)
    .limit(limit);

  return rows.map((r) => ({
    quoteId: r.quoteId,
    quoteText: r.quoteText,
    author: r.author,
    servedDate: r.servedDate,
    weatherCondition: `Code ${r.weatherCode}`,
    toneLabel: r.toneCategoryId.replace(/_/g, " "),
    isBonus: r.isBonus,
  }));
}
