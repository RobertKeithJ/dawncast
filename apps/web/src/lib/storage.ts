/**
 * localStorage utilities for daily quote caching and history.
 * Handles corrupt/missing data gracefully.
 */

const DAILY_QUOTE_KEY = "dawncast:daily_quote";
const HISTORY_KEY = "dawncast:history";
const SEEN_QUOTE_IDS_KEY = "dawncast:seen_quote_ids";
const HISTORY_MAX = 60;

export interface StoredQuote {
  id: string;
  text: string;
  author: string;
  /** YYYY-MM-DD in user's local timezone */
  servedDate: string;
  toneId: string;
  toneLabel: string;
  weatherCode: number;
  weatherCondition: string;
  tempCelsius: number;
}

/** Returns today's date as YYYY-MM-DD in local timezone. */
export function getTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Read the stored primary daily quote. Returns null if missing or stale (different day). */
export function getDailyQuote(): StoredQuote | null {
  try {
    const raw = localStorage.getItem(DAILY_QUOTE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredQuote;
    if (stored.servedDate !== getTodayString()) {
      // Different day — archive to history, clear daily cache and seen IDs
      if (stored.id && stored.id !== "fallback") {
        appendHistory(stored);
      }
      localStorage.removeItem(DAILY_QUOTE_KEY);
      clearSeenQuoteIds();
      return null;
    }
    return stored;
  } catch {
    localStorage.removeItem(DAILY_QUOTE_KEY);
    return null;
  }
}

/** Persist the primary daily quote to localStorage. */
export function setDailyQuote(q: StoredQuote): void {
  try {
    localStorage.setItem(DAILY_QUOTE_KEY, JSON.stringify(q));
  } catch {
    // storage full or unavailable — ignore silently
  }
}

/** Read quote history (newest first). */
export function getHistory(): StoredQuote[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredQuote[];
  } catch {
    return [];
  }
}

/** Prepend a quote to history, capping at HISTORY_MAX entries. */
export function appendHistory(q: StoredQuote): void {
  try {
    const history = getHistory();
    // Avoid duplicates for the same date+id
    const exists = history.some(
      (h) => h.id === q.id && h.servedDate === q.servedDate,
    );
    if (exists) return;
    const updated = [q, ...history].slice(0, HISTORY_MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/** Track a quote ID as having been seen for the day. */
export function markQuoteSeen(id: string): void {
  try {
    const seenIds = getSeenQuoteIds();
    if (!seenIds.includes(id)) {
      localStorage.setItem(
        SEEN_QUOTE_IDS_KEY,
        JSON.stringify([id, ...seenIds]),
      );
    }
  } catch {
    // ignore
  }
}

/** Get all quote IDs seen today. */
export function getSeenQuoteIds(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_QUOTE_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => typeof v === "string");
  } catch {
    return [];
  }
}

/** Check if a quote ID was already seen today. */
export function isQuoteSeen(id: string): boolean {
  return getSeenQuoteIds().includes(id);
}

/** Clear seen quote IDs (called when a new day starts). */
export function clearSeenQuoteIds(): void {
  localStorage.removeItem(SEEN_QUOTE_IDS_KEY);
}
