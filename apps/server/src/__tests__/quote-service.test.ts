import { describe, it, expect } from "vitest";

// Test the stable hash determinism — we inline the logic here since the real
// function lives in the service and would need a DB connection to test fully.
function stableHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

describe("stableHash determinism", () => {
  it("returns the same value for the same seed", () => {
    expect(stableHash("2025-01-15:energy_action:sub123")).toBe(
      stableHash("2025-01-15:energy_action:sub123"),
    );
  });

  it("returns different values for different seeds", () => {
    expect(stableHash("2025-01-15:energy_action:sub123")).not.toBe(
      stableHash("2025-01-16:energy_action:sub123"),
    );
  });

  it("returns a non-negative integer", () => {
    const result = stableHash("test-seed");
    expect(result).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result)).toBe(true);
  });
});
