export const getWeatherClass = (condition: string | undefined) => {
  if (!condition) return "";
  const lower = condition.toLowerCase();
  if (lower.includes("sun") || lower.includes("clear")) return "weather-sunny";
  if (lower.includes("cloud") || lower.includes("overcast")) return "weather-cloudy";
  if (lower.includes("rain") || lower.includes("drizzle")) return "weather-rainy";
  if (lower.includes("storm") || lower.includes("thunder")) return "weather-stormy";
  if (lower.includes("fog") || lower.includes("mist") || lower.includes("haze")) return "weather-foggy";
  if (lower.includes("snow") || lower.includes("sleet")) return "weather-snow";
  if (lower.includes("night")) return "weather-night";
  if (lower.includes("heat") || lower.includes("hot")) return "weather-heat";
  return "";
};
