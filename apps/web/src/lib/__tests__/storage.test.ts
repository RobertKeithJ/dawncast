import { describe, it, expect, beforeEach } from "vitest";
import {
  getTodayString,
  getDailyQuote,
  setDailyQuote,
  getHistory,
  appendHistory,
} from "../storage";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

const MOCK_QUOTE = {
  id: "abc-123",
  text: "Test quote",
  author: "Test Author",
  servedDate: getTodayString(),
  toneId: "energy_action",
  toneLabel: "Energy & Action",
  weatherCode: 0,
  weatherCondition: "Clear sky",
  tempCelsius: 28,
};

beforeEach(() => localStorageMock.clear());

describe("getTodayString", () => {
  it("returns a YYYY-MM-DD formatted string", () => {
    expect(getTodayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getDailyQuote / setDailyQuote", () => {
  it("returns null when storage is empty", () => {
    expect(getDailyQuote()).toBeNull();
  });

  it("returns stored quote when date matches today", () => {
    setDailyQuote(MOCK_QUOTE);
    const result = getDailyQuote();
    expect(result?.id).toBe("abc-123");
    expect(result?.text).toBe("Test quote");
  });

  it("returns null and clears when stored date is stale", () => {
    const staleQuote = { ...MOCK_QUOTE, servedDate: "2020-01-01" };
    setDailyQuote(staleQuote);
    expect(getDailyQuote()).toBeNull();
    expect(localStorageMock.getItem("dawncast:daily_quote")).toBeNull();
  });
});

describe("getHistory / appendHistory", () => {
  it("returns empty array when storage is empty", () => {
    expect(getHistory()).toEqual([]);
  });

  it("prepends entries to history", () => {
    appendHistory(MOCK_QUOTE);
    const history = getHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.id).toBe("abc-123");
  });

  it("does not add duplicate id+date entries", () => {
    appendHistory(MOCK_QUOTE);
    appendHistory(MOCK_QUOTE);
    expect(getHistory()).toHaveLength(1);
  });
});
