# Database Schema

## Tables Overview

```mermaid
erDiagram
    tone_categories ||--o{ quotes : "has many"
    push_subscriptions ||--o{ delivery_log : "has many"
    tone_categories ||--o{ weather_cache : "maps to"
    tone_categories ||--o{ delivery_log : "logs"

    tone_categories {
        text id PK
        string label
        text description
        jsonb weather_codes
        timestamp created_at
    }

    quotes {
        uuid id PK
        text tone_category_id FK
        text text
        string author
        language language
        boolean is_active
        timestamp created_at
    }

    push_subscriptions {
        uuid id PK
        string endpoint UK
        text p256dh
        text auth
        text notify_at
        string timezone
        boolean is_active
        timestamp last_sent_at
        int failure_count
        timestamp created_at
        timestamp updated_at
    }

    delivery_log {
        uuid id PK
        uuid subscription_id FK
        uuid quote_id FK
        string served_date
        int weather_code
        float temperature_celsius
        text tone_category_id FK
        boolean is_bonus
        boolean notification_sent
        timestamp notification_sent_at
        text notification_error
        timestamp created_at
    }

    weather_cache {
        uuid id PK
        float latitude
        float longitude
        string city_name
        int weather_code
        float temperature_celsius
        string condition_label
        text tone_category_id FK
        timestamp fetched_at
        timestamp expires_at
    }
```

## Table Details

### tone_categories
Maps weather conditions to quote tone categories.

| Column | Type | Description |
|--------|------|-------------|
| id | text | Primary key (e.g. "energy_action") |
| label | string | Category name (e.g., "Energy & Action") |
| description | text | Category description |
| weather_codes | jsonb | Array of WMO weather codes |
| created_at | timestamp | Creation timestamp |

### quotes
Motivational quotes classified by tone.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| tone_category_id | text | FK to tone_categories |
| text | text | Quote content |
| author | string | Quote author |
| language | language | Language code (en/fil) |
| is_active | boolean | Whether quote is available |
| created_at | timestamp | Creation timestamp |

### push_subscriptions
Web Push notification subscriptions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| endpoint | string | Push endpoint URL (unique) |
| p256dh | text | VAPID public key |
| auth | text | VAPID auth secret |
| notify_at | text | Preferred notification time (HH:MM) |
| timezone | string | User's timezone |
| is_active | boolean | Subscription status |
| last_sent_at | timestamp | Last notification sent |
| failure_count | int | Consecutive failures |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update |

### delivery_log
Tracks which quotes were served to which subscriptions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| subscription_id | uuid | FK to push_subscriptions |
| quote_id | uuid | FK to quotes |
| served_date | string | Date quote was served (YYYY-MM-DD) |
| weather_code | int | Weather at time of serving |
| temperature_celsius | float | Temperature at serving |
| tone_category_id | text | FK to tone_categories |
| is_bonus | boolean | Whether this was a bonus quote |
| notification_sent | boolean | Whether notification was sent |
| notification_sent_at | timestamp | When notification was sent |
| notification_error | text | Failure reason if push failed |
| created_at | timestamp | Creation timestamp |

### weather_cache
Caches weather data to reduce API calls (60-minute TTL).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| latitude | float | Location latitude (rounded to 2 decimal places) |
| longitude | float | Location longitude (rounded to 2 decimal places) |
| city_name | string | City name (from reverse geocode, if available) |
| weather_code | int | WMO weather code |
| temperature_celsius | float | Temperature in Celsius |
| condition_label | string | Human-readable condition |
| tone_category_id | text | FK to tone_categories |
| fetched_at | timestamp | When weather was fetched |
| expires_at | timestamp | Cache expiration (fetchedAt + 60 min) |