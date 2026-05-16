# AR Daily Motivational Quotes — Gherkin Documentation
**App Type:** Progressive Web App (Web-First, AR-Enhanced)  
**Core Use Case:** Serve weather-aware motivational quotes overlaid in AR  
**Format:** BDD Feature Specifications (Gherkin)

---

## Table of Contents

1. [Weather Detection](#feature-weather-detection)
2. [Quote Selection by Weather](#feature-quote-selection-by-weather)
3. [AR Quote Display](#feature-ar-quote-display)
4. [Daily Quote Logic](#feature-daily-quote-logic)
5. [PWA Installation & Offline](#feature-pwa-installation--offline-support)
6. [Push Notifications](#feature-push-notifications)
7. [Quote Sharing](#feature-quote-sharing)
8. [User Preferences](#feature-user-preferences)
9. [Accessibility](#feature-accessibility)
10. [Error Handling](#feature-error-handling)

---

## Feature: Weather Detection

> The app must detect the user's local weather to contextualize motivational quotes.

```gherkin
Feature: Weather Detection
  As a user
  I want the app to detect my current weather conditions
  So that I receive quotes that feel relevant to my environment

  Background:
    Given the app is loaded in a supported browser
    And the user has not previously denied location access

  Scenario: Successful geolocation on first launch
    When the app requests the user's location
    And the user grants location permission
    Then the app fetches the current weather from the weather API
    And the weather condition is stored in the session
    And the user sees a loading state labeled "Reading your sky..."

  Scenario: Location permission previously granted
    Given the user has already granted location permission
    When the app initializes
    Then geolocation is retrieved silently without a permission prompt
    And weather data is fetched automatically
    And the quote is displayed within 3 seconds

  Scenario: User denies location permission
    When the app requests the user's location
    And the user denies location permission
    Then the app displays a manual location input field
    And a message reads "No worries — tell us your city instead"
    And the user can type a city name to fetch weather manually

  Scenario: Manual city input fallback
    Given the user denied location permission
    When the user types "Davao City" in the location input
    And submits the form
    Then the app geocodes "Davao City" to coordinates
    And fetches the weather for those coordinates
    And displays a weather-matched motivational quote

  Scenario: Weather API returns stale cached data
    Given the last weather fetch was more than 1 hour ago
    When the app initializes
    Then the app re-fetches weather from the API
    And updates the cached weather data
    And re-evaluates the quote category

  Scenario: Weather condition changes mid-day
    Given the morning weather was "sunny"
    And the user opens the app in the afternoon
    When the cached weather is older than 60 minutes
    Then the app silently refreshes weather in the background
    And a subtle notification reads "Your sky changed — here's a new quote"
    And the new quote reflects the updated weather condition
```

---

## Feature: Quote Selection by Weather

> Weather conditions map to emotional tones, which determine the quote pool.

```gherkin
Feature: Quote Selection by Weather
  As a user
  I want to receive a motivational quote that matches my current weather
  So that the message feels contextually meaningful

  Background:
    Given weather data has been successfully fetched
    And the quote database is loaded or cached

  # --- Sunny / Clear ---

  Scenario: Weather is clear or sunny
    Given the weather condition is "clear sky" or "sunny"
    When the app selects a quote
    Then the quote is drawn from the "Energy & Action" pool
    And the AR background uses warm golden ambient tones
    Examples:
      | condition      | expected_tone     |
      | clear sky      | Energy & Action   |
      | sunny          | Energy & Action   |
      | few clouds     | Energy & Action   |

  # --- Cloudy / Overcast ---

  Scenario: Weather is cloudy or overcast
    Given the weather condition is "overcast" or "broken clouds"
    When the app selects a quote
    Then the quote is drawn from the "Patience & Perseverance" pool
    And the AR background uses cool, muted ambient tones
    Examples:
      | condition       | expected_tone            |
      | overcast clouds | Patience & Perseverance  |
      | broken clouds   | Patience & Perseverance  |
      | scattered clouds| Patience & Perseverance  |

  # --- Rainy ---

  Scenario: Weather is rainy or drizzling
    Given the weather condition is "rain" or "drizzle"
    When the app selects a quote
    Then the quote is drawn from the "Resilience & Growth" pool
    And the AR background renders a soft rain particle overlay
    Examples:
      | condition       | expected_tone        |
      | light rain      | Resilience & Growth  |
      | moderate rain   | Resilience & Growth  |
      | drizzle         | Resilience & Growth  |
      | heavy rain      | Resilience & Growth  |

  # --- Stormy / Thunderstorm ---

  Scenario: Weather is stormy or has thunderstorms
    Given the weather condition is "thunderstorm"
    When the app selects a quote
    Then the quote is drawn from the "Courage & Strength" pool
    And the AR background uses dramatic dark ambient tones with lightning flash effect

  # --- Foggy / Misty ---

  Scenario: Weather is foggy or misty
    Given the weather condition is "fog" or "mist" or "haze"
    When the app selects a quote
    Then the quote is drawn from the "Clarity & Focus" pool
    And the AR background uses a soft diffused white overlay

  # --- Snow ---

  Scenario: Weather is snowy
    Given the weather condition is "snow" or "sleet"
    When the app selects a quote
    Then the quote is drawn from the "Rest & Renewal" pool
    And the AR background renders a gentle snow particle overlay

  # --- Extreme Heat ---

  Scenario: Temperature exceeds heat threshold
    Given the temperature is above 35°C
    And the weather condition is "clear sky"
    When the app selects a quote
    Then the quote is drawn from the "Endurance & Grit" pool
    And a heat advisory icon is shown alongside the quote

  # --- Nighttime ---

  Scenario: User opens the app at night regardless of weather
    Given the local time is between 21:00 and 05:00
    When the app selects a quote
    Then the quote is drawn from the "Rest & Reflection" pool
    And the AR background shifts to a dark starfield aesthetic

  Scenario: No matching weather condition found
    Given the weather API returns an unrecognized condition code
    When the app attempts quote selection
    Then it falls back to the "General Motivation" pool
    And logs the unrecognized condition for review
```

---

## Feature: AR Quote Display

> Users can view their daily quote overlaid in their physical environment via the device camera.

```gherkin
Feature: AR Quote Display
  As a user
  I want to see my motivational quote overlaid in my real environment
  So that the experience feels immersive and memorable

  Background:
    Given the user has received their weather-matched quote for the day
    And the browser supports WebXR or the app falls back to CSS AR simulation

  Scenario: User activates AR mode on a supported browser
    Given the device has a camera
    And the browser supports WebXR Device API
    When the user taps "View in AR"
    Then the app requests camera permission
    And upon granting, the camera feed is displayed as the background
    And the motivational quote is rendered as a floating 3D text overlay
    And the quote follows surface detection (e.g., table, floor, wall)

  Scenario: User activates AR mode on unsupported browser
    Given the browser does not support WebXR
    When the user taps "View in AR"
    Then the app activates the camera via getUserMedia API
    And the quote is overlaid using CSS absolute positioning on the video feed
    And a subtle badge reads "Simulated AR"

  Scenario: User denies camera permission for AR
    When the app requests camera permission for AR
    And the user denies it
    Then the AR mode is dismissed
    And the quote is displayed in the standard 2D card view
    And a non-intrusive message reads "AR needs your camera — no worries, here's the quote anyway"

  Scenario: Quote text is readable against bright backgrounds
    Given AR mode is active
    And the camera feed detects a bright or high-luminance background
    Then the quote text renders with a dark semi-transparent backdrop
    And text contrast meets WCAG AA (4.5:1 minimum ratio)

  Scenario: Quote text is readable against dark backgrounds
    Given AR mode is active
    And the camera feed detects a dark or low-luminance background
    Then the quote text renders with a light semi-transparent backdrop
    And text contrast meets WCAG AA (4.5:1 minimum ratio)

  Scenario: User interacts with the AR quote
    Given the AR quote is displayed
    When the user taps the quote overlay
    Then the quote expands to show the author attribution
    And action buttons appear: "Share", "Save", "New Quote"
    And the buttons are touch-target compliant (minimum 44×44px)

  Scenario: AR session ends when app goes to background
    Given AR mode is active
    When the user switches to another app or locks the screen
    Then the camera feed is paused
    And the AR session is suspended cleanly
    When the user returns to the app
    Then the AR session resumes from where it left off

  Scenario: Device orientation changes during AR mode
    Given the user is in AR mode in portrait orientation
    When the device rotates to landscape
    Then the quote overlay repositions to fit the new viewport
    And the camera feed adjusts to the new aspect ratio without distortion
```

---

## Feature: Daily Quote Logic

> Each user receives one primary quote per day, refreshed at midnight local time.

```gherkin
Feature: Daily Quote Logic
  As a user
  I want a fresh motivational quote each day
  So that the experience stays meaningful and non-repetitive

  Background:
    Given the user has the app installed or open in a browser

  Scenario: First quote of the day
    Given no quote has been served today
    When the user opens the app
    Then the app fetches a quote matching today's weather tone
    And records the quote ID and date in local storage
    And displays the quote to the user

  Scenario: Returning to app same day
    Given a quote was already served today
    When the user opens the app again
    Then the same quote is retrieved from local storage
    And no new API call is made for a fresh quote
    And the user sees their quote with a "Your quote for today" label

  Scenario: Midnight rollover triggers new quote
    Given the user received a quote on the previous day
    And the local time has passed midnight
    When the user opens the app
    Then the previous quote is archived in the history
    And a new weather-matched quote is fetched and displayed

  Scenario: User requests a new quote manually
    Given the daily quote has already been served
    When the user taps "Give me another one"
    Then the app serves a secondary quote from the same weather pool
    And marks it as "Bonus Quote" (not replacing the daily quote)
    And the secondary quote is not saved as the day's primary quote

  Scenario: No repeat quotes within 30 days
    Given the user has received quotes over multiple days
    When the app selects a new daily quote
    Then it checks the last 30 days of quote history
    And excludes previously seen quote IDs from the selection pool
    And if the pool is exhausted, it resets and notifies the user

  Scenario: Quote history is accessible
    Given the user has received quotes on multiple past days
    When the user navigates to "My Quote History"
    Then they see a chronological list of past quotes
    And each entry shows the quote text, author, date, and weather condition
    And they can tap any entry to view it in full
```

---

## Feature: PWA Installation & Offline Support

> The app works reliably as a PWA, including offline access to cached quotes.

```gherkin
Feature: PWA Installation & Offline Support
  As a user
  I want to install the app and use it offline
  So that I can access my quote even without an internet connection

  Background:
    Given the app has a valid Web App Manifest and Service Worker registered

  Scenario: Install prompt appears on eligible browsers
    Given the user has visited the app at least twice
    And the browser supports the beforeinstallprompt event
    When the user has been on the app for more than 30 seconds
    Then a non-intrusive install banner appears at the bottom of the screen
    And it reads "Add to your home screen for daily quotes"
    And it has "Install" and "Not now" buttons

  Scenario: User installs the PWA
    Given the install prompt is visible
    When the user taps "Install"
    Then the browser's native install dialog appears
    And upon confirmation, the app is added to the home screen
    And the install banner is dismissed permanently

  Scenario: User dismisses install prompt
    Given the install prompt is visible
    When the user taps "Not now"
    Then the banner is hidden
    And it does not reappear for at least 7 days

  Scenario: App is launched from home screen
    Given the PWA is installed on the device
    When the user taps the app icon on the home screen
    Then the app opens in standalone mode (no browser chrome)
    And the splash screen displays the app logo and tagline
    And the daily quote loads within 2 seconds

  Scenario: App opens with no internet connection (quote already cached)
    Given the user previously opened the app with internet access
    And the daily quote and assets were cached by the Service Worker
    When the user opens the app offline
    Then the cached quote is displayed immediately
    And an offline indicator badge is shown ("Offline — showing today's quote")
    And AR mode is disabled with a message "AR requires camera + connection"

  Scenario: App opens with no internet and no cached quote
    Given the user has never opened the app before
    And there is no internet connection
    When the user opens the app
    Then a friendly error screen is shown
    And it reads "You're offline and we don't have a quote cached yet. Connect to get your first one!"
    And a retry button is available

  Scenario: Service Worker caches new quote on background sync
    Given the user has the PWA installed
    And the device regains internet connectivity
    When the Background Sync API fires
    Then the Service Worker fetches the next day's quote preemptively
    And caches it for immediate access tomorrow
```

---

## Feature: Push Notifications

> Users receive a daily push notification to remind them to view their quote.

```gherkin
Feature: Push Notifications
  As a user
  I want to receive a daily reminder notification
  So that I don't forget to check my motivational quote

  Background:
    Given the app is installed as a PWA
    And the browser supports the Push API

  Scenario: App requests notification permission on first install
    Given the user just installed the PWA
    When they open the app for the first time post-install
    Then the app presents a permission request
    And explains "Get your daily quote delivered each morning"
    And offers "Sure, remind me" and "Skip" options

  Scenario: User enables push notifications
    Given the notification permission dialog is shown
    When the user taps "Sure, remind me"
    Then the browser's native permission prompt appears
    And upon granting, the user is subscribed to push notifications
    And a default notification time of 08:00 local time is set
    And a confirmation reads "You'll get your quote every morning at 8 AM"

  Scenario: Daily notification is delivered at scheduled time
    Given the user is subscribed to push notifications
    And the current local time is 08:00
    When the push server sends the daily notification
    Then the device displays a notification with the quote teaser (first 80 characters)
    And the notification title is "Your quote for today ☀️" (with weather-appropriate emoji)
    And tapping the notification opens the app directly to the quote

  Scenario: User changes notification time
    Given notifications are enabled
    When the user navigates to Preferences > Notification Time
    And selects "07:00 AM"
    Then the push subscription schedule is updated
    And the next notification fires at 07:00 local time

  Scenario: User disables push notifications
    Given notifications are enabled
    When the user navigates to Preferences > Notifications
    And toggles off "Daily Reminders"
    Then the push subscription is revoked on the server
    And no further notifications are sent
    And the toggle state is saved in local storage

  Scenario: Notification received while app is in foreground
    Given the user has the app open
    When a push notification arrives
    Then no system notification is displayed
    And instead, a subtle in-app toast appears at the top
    And it reads "Your morning quote is ready"
```

---

## Feature: Quote Sharing

> Users can share their daily quote to social media or messaging apps.

```gherkin
Feature: Quote Sharing
  As a user
  I want to share my motivational quote with others
  So that I can spread positivity

  Background:
    Given the user has received their daily quote

  Scenario: User shares quote via Web Share API
    Given the browser supports the Web Share API
    When the user taps the "Share" button
    Then the native share sheet appears
    And the share payload includes:
      | field   | value                                      |
      | title   | My quote for today — [App Name]            |
      | text    | "[Quote text]" — [Author]                  |
      | url     | Deep link to the quote in the app          |

  Scenario: User shares quote on unsupported browsers
    Given the browser does not support the Web Share API
    When the user taps "Share"
    Then a custom share modal appears
    And it shows buttons for: Copy Link, Twitter/X, Facebook, WhatsApp
    And each button opens the correct sharing URL in a new tab

  Scenario: User copies quote to clipboard
    Given the share modal is open
    When the user taps "Copy"
    Then the quote text and author are copied to the clipboard
    And a toast notification reads "Copied to clipboard!"

  Scenario: User shares AR screenshot of quote
    Given the user is in AR mode
    When the user taps "Capture & Share"
    Then the app takes a screenshot of the AR view
    And opens the native share sheet with the image attached
    And the image is watermarked with the app name in the corner

  Scenario: Shared quote link opens correctly
    Given another user receives a shared quote link
    When they tap the link
    Then the app opens (or the web version in a browser)
    And displays the shared quote in the standard 2D card view
    And prompts the recipient to "Get your own daily quote"
```

---

## Feature: User Preferences

> Users can personalize the experience through quote tone preferences and display settings.

```gherkin
Feature: User Preferences
  As a user
  I want to customize how the app behaves
  So that it fits my personal needs and taste

  Background:
    Given the user has opened the app at least once
    And preferences are stored in local storage

  Scenario: User sets preferred quote tone categories
    Given the user is on the Preferences screen
    When they select "Resilience & Growth" and "Clarity & Focus" as favorites
    Then these categories are weighted higher in quote selection
    And the selected categories are visually highlighted in the UI
    And preference is saved immediately without a save button

  Scenario: User enables Dark Mode
    Given the app is in Light Mode by default
    When the user toggles "Dark Mode" in preferences
    Then the UI switches to a dark color scheme instantly
    And the AR overlay adapts its background contrast for dark mode
    And the preference persists across sessions

  Scenario: User sets temperature unit preference
    Given the app defaults to Celsius
    When the user selects "Fahrenheit" in preferences
    Then all temperature displays update to Fahrenheit
    And the heat threshold logic converts its trigger to 95°F

  Scenario: User selects quote language
    Given the app supports English and Filipino (Tagalog)
    When the user selects "Filipino" as their preferred language
    Then quotes are served in Filipino where translations are available
    And the UI language switches to Filipino
    And a notice reads "Ilang quotes ay nasa English pa rin"

  Scenario: User resets all preferences to default
    Given the user has set custom preferences
    When they tap "Reset to Default" in the Preferences screen
    Then all preferences are cleared from local storage
    And the app returns to its default state
    And a confirmation dialog asks "Sure? This clears your settings" before proceeding
```

---

## Feature: Accessibility

> The app must be usable by people with varying accessibility needs.

```gherkin
Feature: Accessibility
  As a user with accessibility needs
  I want the app to be fully usable
  So that motivational quotes are accessible to everyone

  Scenario: Screen reader announces the daily quote
    Given the user uses a screen reader (e.g., TalkBack, VoiceOver)
    When the daily quote loads
    Then the quote text is wrapped in an aria-live="polite" region
    And the screen reader announces the full quote and author

  Scenario: AR mode is skipped gracefully for screen reader users
    Given a screen reader is detected
    When the quote page loads
    Then the "View in AR" button is visible but labeled with aria-describedby
    And the description reads "Requires camera access; skippable"
    And the standard quote view is the default focus

  Scenario: All interactive elements are keyboard-navigable
    Given the user navigates with a keyboard
    Then all buttons, toggles, and links are reachable via Tab key
    And the active element has a clearly visible focus ring
    And no keyboard traps exist in any modal or overlay

  Scenario: Text size adjusts to system font scale settings
    Given the user has set a larger font size in their OS accessibility settings
    When the app loads
    Then the quote text scales proportionally using relative units (rem/em)
    And the layout does not break at 200% font scale

  Scenario: Color is never the sole indicator of meaning
    Given the weather-based color themes are applied
    When a quote category is indicated
    Then it is labeled with text or icon in addition to color
    So that color-blind users can still distinguish categories
```

---

## Feature: Error Handling

> The app handles failures gracefully without breaking the user experience.

```gherkin
Feature: Error Handling
  As a user
  I want the app to handle errors gracefully
  So that failures don't ruin my experience

  Scenario: Weather API is unavailable
    Given the weather API returns a 5xx error or times out
    When the app attempts to fetch weather
    Then the app retries once after 3 seconds
    And if the retry fails, displays the last cached weather condition
    And shows a subtle notice: "Using your last known weather"

  Scenario: Quote API is unavailable
    Given the quote API returns an error
    When the app attempts to fetch a quote
    Then it falls back to a locally bundled set of 50 offline quotes
    And an indicator reads "Offline quotes — connect for personalized ones"

  Scenario: Camera access fails during AR initialization
    Given the user tapped "View in AR"
    And the camera hardware fails to initialize
    Then a friendly error card is shown in place of the AR view
    And it reads "Camera couldn't start — here's your quote the regular way"
    And the standard 2D quote card is shown immediately

  Scenario: App detects a corrupt local storage state
    Given local storage contains invalid or malformed data
    When the app initializes and reads local storage
    Then the corrupted keys are cleared silently
    And the app starts fresh as if it were a first visit
    And no error is surfaced to the user

  Scenario: User's device clock is wrong and affects midnight rollover
    Given the device system clock is set to an incorrect date
    When the app evaluates whether to serve a new daily quote
    Then it cross-references the date with the server timestamp
    And uses the server date for rollover logic
    And logs a clock discrepancy event silently
```

---

*Document generated for: AR Daily Motivational Quotes PWA*  
*Spec format: Gherkin BDD (Cucumber-compatible)*  
*Last updated: 2026-05-14*
