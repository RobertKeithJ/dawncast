import { describe, it, expect } from "vitest";
import { getToneForWeatherCode, getWeatherConditionLabel } from "../functions";

describe("getToneForWeatherCode", () => {
  it("maps clear sky (code 0) to energy_action", () => {
    expect(getToneForWeatherCode(0)).toEqual({
      toneId: "energy_action",
      toneLabel: "Energy & Action",
    });
  });

  it("maps mainly clear (code 1) to energy_action", () => {
    expect(getToneForWeatherCode(1)).toEqual({
      toneId: "energy_action",
      toneLabel: "Energy & Action",
    });
  });

  it("maps partly cloudy (code 2) to energy_action", () => {
    expect(getToneForWeatherCode(2)).toEqual({
      toneId: "energy_action",
      toneLabel: "Energy & Action",
    });
  });

  it("maps overcast (code 3) to patience_perseverance", () => {
    expect(getToneForWeatherCode(3)).toEqual({
      toneId: "patience_perseverance",
      toneLabel: "Patience & Perseverance",
    });
  });

  it("maps light drizzle (code 51) to resilience_growth", () => {
    expect(getToneForWeatherCode(51)).toEqual({
      toneId: "resilience_growth",
      toneLabel: "Resilience & Growth",
    });
  });

  it("maps heavy rain (code 65) to resilience_growth", () => {
    expect(getToneForWeatherCode(65)).toEqual({
      toneId: "resilience_growth",
      toneLabel: "Resilience & Growth",
    });
  });

  it("maps slight rain showers (code 80) to resilience_growth", () => {
    expect(getToneForWeatherCode(80)).toEqual({
      toneId: "resilience_growth",
      toneLabel: "Resilience & Growth",
    });
  });

  it("maps thunderstorm (code 95) to courage_strength", () => {
    expect(getToneForWeatherCode(95)).toEqual({
      toneId: "courage_strength",
      toneLabel: "Courage & Strength",
    });
  });

  it("maps fog (code 45) to clarity_focus", () => {
    expect(getToneForWeatherCode(45)).toEqual({
      toneId: "clarity_focus",
      toneLabel: "Clarity & Focus",
    });
  });

  it("maps depositing rime fog (code 48) to clarity_focus", () => {
    expect(getToneForWeatherCode(48)).toEqual({
      toneId: "clarity_focus",
      toneLabel: "Clarity & Focus",
    });
  });

  it("maps slight snow fall (code 71) to rest_renewal", () => {
    expect(getToneForWeatherCode(71)).toEqual({
      toneId: "rest_renewal",
      toneLabel: "Rest & Renewal",
    });
  });

  it("maps slight snow showers (code 85) to rest_renewal", () => {
    expect(getToneForWeatherCode(85)).toEqual({
      toneId: "rest_renewal",
      toneLabel: "Rest & Renewal",
    });
  });

  it("maps unknown code to general_motivation", () => {
    expect(getToneForWeatherCode(999)).toEqual({
      toneId: "general_motivation",
      toneLabel: "General Motivation",
    });
  });
});

describe("getWeatherConditionLabel", () => {
  it("returns 'Clear sky' for code 0", () => {
    expect(getWeatherConditionLabel(0)).toBe("Clear sky");
  });

  it("returns 'Thunderstorm' for code 95", () => {
    expect(getWeatherConditionLabel(95)).toBe("Thunderstorm");
  });

  it("returns 'Heavy snow fall' for code 75", () => {
    expect(getWeatherConditionLabel(75)).toBe("Heavy snow fall");
  });

  it("returns 'Unknown' for unmapped code", () => {
    expect(getWeatherConditionLabel(999)).toBe("Unknown");
  });
});
