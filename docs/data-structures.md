# Data Structures

## TypeScript Types

### API Request/Response Types

```typescript
// GET /api/daily-quote query params
interface DailyQuoteParams {
  lat?: number;
  lon?: number;
  city?: string;
  subscriptionId?: string;
  language?: "en" | "fil";
}

// API response wrapper
interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Daily quote response
interface DailyQuoteResponse {
  quote: Quote;
  weather: WeatherInfo;
  meta: QuoteMeta;
}

// Bonus quote request
interface BonusQuoteRequest {
  lat?: number;
  lon?: number;
  city?: string;
  subscriptionId?: string;
  language?: "en" | "fil";
}

// Quote history response
interface HistoryResponse {
  entries: HistoryEntry[];
}

interface HistoryEntry {
  quote: Quote;
  servedAt: string;
  weatherCode: number;
  temperatureCelsius: number;
  toneCategory: string;
  isBonus: boolean;
}
```

### Domain Types

```typescript
// Quote from database
interface Quote {
  id: string;
  text: string;
  author: string;
  language: string;
}

// Weather information
interface WeatherInfo {
  temperatureCelsius: number;
  weatherCode: number;
  conditionLabel: string;
}

// Quote metadata
interface QuoteMeta {
  toneCategory: ToneCategory;
  isCached: boolean;
  isBonus?: boolean;
}

// Tone category enum
type ToneCategory =
  | "energy_action"
  | "patience_perseverance"
  | "clarity_focus"
  | "resilience_growth"
  | "rest_renewal"
  | "courage_strength";
```

### Push Subscription Types

```typescript
// Web Push subscription keys
interface PushKeys {
  p256dh: string;
  auth: string;
}

// Subscribe request
interface SubscribeRequest {
  endpoint: string;
  keys: PushKeys;
  timezone?: string;
  notifyAt?: string; // "HH:MM" format
}

// Subscribe response
interface SubscribeResponse {
  success: boolean;
  subscriptionId?: string;
}

// Unsubscribe request
interface UnsubscribeRequest {
  endpoint: string;
}

// User preferences
interface UserPreferences {
  notifyAt: string;
  timezone: string;
  isActive: boolean;
}

// Update preferences request
interface UpdatePreferencesRequest {
  subscriptionId: string;
  notifyAt?: string;
  timezone?: string;
}
```

### Database Types (Drizzle)

```typescript
// Tone category row
interface ToneCategoryRow {
  id: number;
  label: string;
  description: string;
  weather_codes: number[];
  created_at: Date;
}

// Quote row
interface QuoteRow {
  id: string;
  tone_category_id: number;
  text: string;
  author: string;
  language: string;
  is_active: boolean;
  created_at: Date;
}

// Push subscription row
interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  notify_at: string | null;
  timezone: string | null;
  is_active: boolean;
  last_sent_at: Date | null;
  failure_count: number;
  created_at: Date;
  updated_at: Date;
}

// Delivery log row
interface DeliveryLogRow {
  id: string;
  subscription_id: string;
  quote_id: string;
  served_date: string;
  weather_code: number;
  temperature_celsius: number;
  tone_category_id: number;
  is_bonus: boolean;
  notification_sent: boolean;
  created_at: Date;
}

// Weather cache row
interface WeatherCacheRow {
  id: string;
  latitude: number;
  longitude: number;
  city_name: string | null;
  weather_code: number;
  temperature_celsius: number;
  condition_label: string;
  tone_category_id: number;
  fetched_at: Date;
  expires_at: Date;
}
```

### Service Types

```typescript
// Weather service output
interface ResolvedWeather {
  temperatureCelsius: number;
  weatherCode: number;
  conditionLabel: string;
  toneCategory: ToneCategory;
  cityName?: string;
  isCached: boolean;
}

// Quote selection input
interface QuoteSelectionInput {
  toneCategoryId: number;
  servedDate: string; // YYYY-MM-DD
  subscriptionId?: string;
  excludeQuoteIds?: string[];
}

// Daily quote service output
interface DailyQuoteResult {
  quote: QuoteRow;
  weather: ResolvedWeather;
  meta: {
    toneCategory: string;
    isCached: boolean;
  };
}
```

### WMO Weather Codes

```typescript
// WMO Weather interpretation codes (WW)
enum WMOWeatherCode {
  Clear = 0,
  MainlyClear = 1,
  PartlyCloudy = 3,
  Overcast = 45,
  Fog = 48,
  DrizzleLight = 51,
  DrizzleModerate = 53,
  DrizzleDense = 55,
  RainSlight = 61,
  RainModerate = 63,
  RainHeavy = 65,
  SnowSlight = 71,
  SnowModerate = 73,
  SnowHeavy = 75,
  RainShowersSlight = 80,
  RainShowersModerate = 81,
  RainShowersViolent = 82,
  SnowShowersSlight = 85,
  SnowShowersHeavy = 86,
  Thunderstorm = 95,
  ThunderstormSlightHail = 96,
  ThunderstormHeavyHail = 99,
}
```

### Client-Side Storage Types

```typescript
// LocalStorage keys
enum StorageKey {
  DailyQuote = "dq_daily_quote",
  QuoteHistory = "dq_history",
  SubscriptionId = "dq_subscription_id",
  Theme = "theme",
}

// Cached daily quote in localStorage
interface CachedDailyQuote {
  quote: Quote;
  weather: WeatherInfo;
  servedDate: string;
  toneCategory: string;
}

// Local quote history entry
interface LocalHistoryEntry {
  quote: Quote;
  servedAt: string;
  weatherCode: number;
  temperatureCelsius: number;
  toneCategory: string;
  isBonus: boolean;
}
```