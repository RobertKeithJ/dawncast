/** Shape of a result entry from the Open-Meteo Geocoding API */
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
}

/** Top-level response from the Open-Meteo Geocoding API */
export interface GeocodingResponse {
  results?: GeocodingResult[];
}

/** `current` block returned by the Open-Meteo Forecast API */
export interface OpenMeteoCurrentWeather {
  weather_code: number;
  temperature_2m: number;
}

/** Top-level response from the Open-Meteo Forecast API */
export interface OpenMeteoForecastResponse {
  current: OpenMeteoCurrentWeather;
}

/** A single quote entry from the ZenQuotes API */
export interface ZenQuote {
  /** Quote text */
  q: string;
  /** Author name */
  a: string;
}
