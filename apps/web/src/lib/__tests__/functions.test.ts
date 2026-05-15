import { describe, it, expect } from "vitest";
import { getWeatherClass } from "../functions";

describe("getWeatherClass", () => {
  it("returns weather-sunny for clear sky", () => {
    expect(getWeatherClass("Clear sky")).toBe("weather-sunny");
  });

  it("returns weather-sunny for sunny condition", () => {
    expect(getWeatherClass("Sunny")).toBe("weather-sunny");
  });

  it("returns weather-cloudy for overcast", () => {
    expect(getWeatherClass("Overcast")).toBe("weather-cloudy");
  });

  it("returns weather-cloudy for partly cloudy", () => {
    expect(getWeatherClass("Partly cloudy")).toBe("weather-cloudy");
  });

  it("returns weather-rainy for moderate rain", () => {
    expect(getWeatherClass("Moderate rain")).toBe("weather-rainy");
  });

  it("returns weather-rainy for drizzle", () => {
    expect(getWeatherClass("Light drizzle")).toBe("weather-rainy");
  });

  it("returns weather-stormy for thunderstorm", () => {
    expect(getWeatherClass("Thunderstorm")).toBe("weather-stormy");
  });

  it("returns weather-foggy for fog", () => {
    expect(getWeatherClass("Fog")).toBe("weather-foggy");
  });

  it("returns weather-foggy for mist", () => {
    expect(getWeatherClass("Mist")).toBe("weather-foggy");
  });

  it("returns weather-snow for slight snow fall", () => {
    expect(getWeatherClass("Slight snow fall")).toBe("weather-snow");
  });

  it("returns weather-snow for sleet", () => {
    expect(getWeatherClass("Sleet")).toBe("weather-snow");
  });

  it("returns empty string for unknown condition", () => {
    expect(getWeatherClass("Volcano eruption")).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(getWeatherClass(undefined)).toBe("");
  });

  it("is case-insensitive", () => {
    expect(getWeatherClass("CLEAR SKY")).toBe("weather-sunny");
  });
});
