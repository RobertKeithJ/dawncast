/**
 * WeatherService — wraps Open-Meteo API with a 60-minute DB cache.
 * Reads from weather_cache before hitting the external API.
 */
import { and, gt, sql } from "drizzle-orm";
import { db, weatherCache } from "@dawncast/db";
import { getToneForWeatherCode, getWeatherConditionLabel } from "../functions";
import type { GeocodingResponse, OpenMeteoForecastResponse } from "../types";
import {
  OPENMETEO_GEOCODING_API_URL,
  OPENMETEO_FORECAST_API_URL,
} from "../constants";

export interface WeatherResult {
  weatherCode: number;
  temperatureCelsius: number;
  conditionLabel: string;
  toneId: string;
  toneLabel: string;
  fromCache: boolean;
}

/** Round coordinate to 2 decimal places (~1.1 km grid). */
function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Geocode a city name to lat/lon using Open-Meteo Geocoding API. */
export async function geocodeCity(
  city: string,
): Promise<{ lat: number; lon: number } | null> {
  try {
    const res = await fetch(
      `${OPENMETEO_GEOCODING_API_URL}?name=${encodeURIComponent(city)}&count=1`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as GeocodingResponse;
    const first = data.results?.[0];
    if (!first) return null;
    return { lat: first.latitude, lon: first.longitude };
  } catch (e) {
    console.error("[weather] geocode failed:", e);
    return null;
  }
}

/** Look up unexpired cache entry for a rounded coordinate pair. */
async function getCachedWeather(
  lat: number,
  lon: number,
): Promise<WeatherResult | null> {
  const roundedLat = roundCoord(lat);
  const roundedLon = roundCoord(lon);
  const now = new Date();

  const rows = await db
    .select()
    .from(weatherCache)
    .where(
      and(
        sql`${weatherCache.latitude} = ${roundedLat}`,
        sql`${weatherCache.longitude} = ${roundedLon}`,
        gt(weatherCache.expiresAt, now),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    weatherCode: row.weatherCode,
    temperatureCelsius: row.temperatureCelsius,
    conditionLabel: row.conditionLabel,
    toneId: row.toneCategoryId,
    toneLabel: getToneForWeatherCode(row.weatherCode).toneLabel,
    fromCache: true,
  };
}

/** Fetch live weather from Open-Meteo and persist to cache. */
async function fetchAndCacheWeather(
  lat: number,
  lon: number,
): Promise<WeatherResult> {
  const roundedLat = roundCoord(lat);
  const roundedLon = roundCoord(lon);

  let weatherCode = 0;
  let temperatureCelsius = 25;

  try {
    const res = await fetch(
      `${OPENMETEO_FORECAST_API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
    );
    if (res.ok) {
      const data = (await res.json()) as OpenMeteoForecastResponse;
      weatherCode = data.current.weather_code;
      temperatureCelsius = data.current.temperature_2m;
    }
  } catch (e) {
    console.error("[weather] fetch failed, using defaults:", e);
  }

  const { toneId, toneLabel } = getToneForWeatherCode(weatherCode);
  const conditionLabel = getWeatherConditionLabel(weatherCode);
  const fetchedAt = new Date();
  const expiresAt = new Date(fetchedAt.getTime() + 60 * 60 * 1000); // +60 min

  // Upsert cache entry (replace if same rounded coordinate exists)
  await db
    .insert(weatherCache)
    .values({
      latitude: roundedLat,
      longitude: roundedLon,
      weatherCode,
      temperatureCelsius,
      conditionLabel,
      toneCategoryId: toneId,
      fetchedAt,
      expiresAt,
    })
    .onConflictDoNothing();

  return {
    weatherCode,
    temperatureCelsius,
    conditionLabel,
    toneId,
    toneLabel,
    fromCache: false,
  };
}

/**
 * Main entry point — resolves weather for a request.
 * Handles geocoding, cache read-through, and live fetch fallback.
 */
export async function resolveWeather(params: {
  lat?: number | null;
  lon?: number | null;
  city?: string | null;
}): Promise<WeatherResult> {
  let lat = params.lat ?? null;
  let lon = params.lon ?? null;

  // Geocode city if no coordinates provided
  if (params.city && (lat === null || lon === null)) {
    const coords = await geocodeCity(params.city);
    if (coords) {
      lat = coords.lat;
      lon = coords.lon;
    }
  }

  if (lat === null || lon === null) {
    // No location at all — return default clear sky
    const { toneId, toneLabel } = getToneForWeatherCode(0);
    return {
      weatherCode: 0,
      temperatureCelsius: 25,
      conditionLabel: getWeatherConditionLabel(0),
      toneId,
      toneLabel,
      fromCache: false,
    };
  }

  const cached = await getCachedWeather(lat, lon);
  if (cached) return cached;

  return fetchAndCacheWeather(lat, lon);
}
