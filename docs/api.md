# API Reference

## Base URL

```
http://localhost:3000 (development)
https://your-server.up.railway.app (production)
```

## Endpoints

### GET /api/daily-quote

Get the primary daily quote based on weather conditions.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| lat | number | No* | Latitude |
| lon | number | No* | Longitude |
| city | string | No* | City name (alternative to lat/lon) |
| subscriptionId | uuid | No | Push subscription ID |
| language | string | No | Language code (en/fil) |

*Either lat/lon or city is required.

**Response:**
```json
{
  "quote": {
    "id": "uuid",
    "text": "The only way to do great work...",
    "author": "Steve Jobs",
    "language": "en"
  },
  "weather": {
    "code": 1,
    "condition": "Mainly Clear",
    "temp": 22,
    "toneId": "energy_action",
    "toneLabel": "Energy & Action"
  },
  "meta": {
    "servedDate": "2026-05-18",
    "fromWeatherCache": false
  }
}
```

---

### POST /api/quote/bonus

Get a bonus quote (different from primary).

**Request Body:**
```json
{
  "lat": 40.7128,
  "lon": -74.006,
  "city": "New York",
  "subscriptionId": "uuid",
  "language": "en",
  "excludeIds": ["uuid", "uuid"]
}
```

All fields optional. At least `lat/lon` or `city` is needed for weather. `excludeIds` is used for same-day deduplication on anonymous (non-subscribed) users — the server will not return any quote whose ID appears in this list.

**Response:**
```json
{
  "quote": {
    "id": "uuid",
    "text": "Another inspiring quote...",
    "author": "Author Name"
  },
  "meta": {
    "servedDate": "2026-05-18"
  }
}
```

---

### GET /api/quote/history

Get quote history for a subscription.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| subscriptionId | uuid | Yes | Push subscription ID |
| limit | number | No | Max entries (default: 30) |

**Response:**
```json
{
  "entries": [
    {
      "quote": { "id": "uuid", "text": "...", "author": "..." },
      "servedAt": "2026-05-17T10:30:00Z",
      "weatherCode": 1,
      "temperatureCelsius": 22,
      "toneLabel": "Energy & Action",
      "isPrimary": false
    }
  ]
}
```

---

### POST /api/subscribe

Register for push notifications.

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNc...",
    "auth": "tG..."
  },
  "timezone": "America/New_York",
  "notifyAt": "09:00"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "uuid"
}
```

---

### POST /api/unsubscribe

Unregister push subscription.

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response:**
```json
{
  "success": true
}
```

---

### GET /api/preferences

Get user preferences.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| subscriptionId | uuid | Yes | Push subscription ID |

**Response:**
```json
{
  "notifyAt": "09:00",
  "timezone": "America/New_York",
  "isActive": true
}
```

---

### POST /api/preferences

Update user preferences.

**Request Body:**
```json
{
  "subscriptionId": "uuid",
  "notifyAt": "08:30",
  "timezone": "America/Los_Angeles"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Health Check

### GET /

Returns server status.

**Response:**
```
OK
```

---

## Error Responses

All endpoints may return errors in this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid parameters"
  }
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid input parameters
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error