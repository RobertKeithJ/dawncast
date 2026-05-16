import { weatherConditionMapping } from "./constants";

export function getToneForWeatherCode(code: number): { toneId: string, toneLabel: string } {
  if (code === 0 || code === 1 || code === 2) {
    return { toneId: "energy_action", toneLabel: "Energy & Action" };
  } else if (code === 3) {
    return { toneId: "patience_perseverance", toneLabel: "Patience & Perseverance" };
  } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { toneId: "resilience_growth", toneLabel: "Resilience & Growth" };
  } else if (code >= 95 && code <= 99) {
    return { toneId: "courage_strength", toneLabel: "Courage & Strength" };
  } else if (code === 45 || code === 48) {
    return { toneId: "clarity_focus", toneLabel: "Clarity & Focus" };
  } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return { toneId: "rest_renewal", toneLabel: "Rest & Renewal" };
  }
  return { toneId: "general_motivation", toneLabel: "General Motivation" };
}

export function getWeatherConditionLabel(code: number): string {
  return weatherConditionMapping[code] || "Unknown";
}
