# PWA Install Prompt — Gherkin Feature Spec
**Feature:** Custom PWA Install Prompt (Sonner Toast)
**App:** Dawncast — Weather-Aware Motivational PWA
**Format:** BDD Feature Specifications (Gherkin / Cucumber-compatible)

---

## Table of Contents

1. [Full Onboarding Flow (Location → Quote → Install)](#feature-pwa-install-prompt--onboarding-flow)
2. [Install Prompt Trigger Rules](#feature-install-prompt-trigger-rules)
3. [Install Prompt UI (Sonner Toast)](#feature-install-prompt-ui--sonner-toast)
4. [User Accepts Installation](#feature-user-accepts-installation)
5. [User Dismisses the Prompt](#feature-user-dismisses-the-prompt)
6. [Re-prompt Deferral Logic](#feature-re-prompt-deferral-logic)
7. [Already Installed Guard](#feature-already-installed-guard)
8. [Browser Compatibility](#feature-browser-compatibility)
9. [Accessibility](#feature-install-prompt-accessibility)

---

## Feature: PWA Install Prompt — Onboarding Flow

> The install prompt appears at the end of the onboarding funnel — after the user has
> received their first weather-matched quote. It is never shown on a blank or loading screen.

```gherkin
Feature: PWA Install Prompt — Onboarding Flow
  As a first-time visitor
  I want to be invited to install the app only after I have experienced its value
  So that the install offer feels earned rather than intrusive

  Background:
    Given the user is visiting Dawncast for the first time
    And the browser has fired a "beforeinstallprompt" event
    And the app has intercepted and deferred the native install prompt
    And the user has not previously dismissed or accepted the install prompt

  # ── Step 1: Location detection ───────────────────────────────────────────

  Scenario: Geolocation is granted and quote renders — install toast appears
    Given the browser can access the user's geolocation
    When the user grants location permission
    And the app fetches weather for the detected coordinates
    And the daily quote card finishes its entrance animation
    Then the install prompt toast appears at the bottom-right corner of the screen
    And it appears 1500ms after the quote card is fully visible
    And it slides in from the bottom-right using the Sonner animation

  Scenario: Geolocation is blocked — manual location input is shown
    Given the browser cannot access the user's geolocation
    Or the user has previously denied location permission
    When the app detects the geolocation failure
    Then a manual location input overlay is displayed
    And the input label reads "Where are you right now?"
    And a sub-label reads "No worries — tell us your city instead"
    And the install prompt toast is NOT shown at this stage

  Scenario: User enters "Davao City" in the manual location input
    Given the manual location input overlay is visible
    When the user types "Davao City" into the location field
    And the user submits the form by pressing Enter or tapping the submit button
    Then the app geocodes "Davao City" to its coordinates
    And fetches the current weather for those coordinates
    And dismisses the location input overlay
    And renders the daily quote card with the weather-matched tone
    And after the quote card entrance animation completes
    Then the install prompt toast appears at the bottom-right corner
    And it slides in 1500ms after the quote card is fully visible

  Scenario: Location geocoding fails for the entered city
    Given the user has submitted a city name
    And the geocoding API returns no results
    Then the location input field shows an inline error
    And the error reads "We couldn't find that city — try another spelling"
    And the install prompt toast is NOT shown
    And the user remains on the location input screen

  # ── Step 2: Quote is visible ──────────────────────────────────────────────

  Scenario: Quote card is visible before install toast fires
    Given the daily quote card has rendered with text and weather badge
    And the quote card's CSS entrance animation has ended
    When the 1500ms delay elapses
    Then the install toast becomes visible
    And the quote card remains unobscured in its primary reading area
    And the install toast does not overlap the quote text or the author attribution

  Scenario: Install toast does not appear if quote has not yet rendered
    Given the app is in a loading state
    And the weather fetch is still in progress
    When the "beforeinstallprompt" event has already been captured
    Then the install prompt toast is NOT shown
    And it waits until the quote card reaches its "visible" state
```

---

## Feature: Install Prompt Trigger Rules

> The prompt must be gated by browser support, install eligibility, and user history.

```gherkin
Feature: Install Prompt Trigger Rules
  As the application
  I want to show the install prompt only under the correct conditions
  So that users are never shown a broken or redundant experience

  Background:
    Given the app is running in a browser context

  Scenario: "beforeinstallprompt" event is captured and deferred
    When the browser fires the "beforeinstallprompt" event on page load
    Then the app calls event.preventDefault() on the event
    And stores the deferred prompt in a React context as "installPromptEvent"
    And sets an internal flag "isPWAInstallable" to true
    And does NOT show the native browser install banner

  Scenario: "beforeinstallprompt" event never fires
    Given the browser does not fire a "beforeinstallprompt" event
    When the quote card finishes rendering
    Then the install prompt toast is NOT shown
    And no install UI element is rendered in the DOM

  Scenario: App is already running in standalone mode
    Given the app is already installed on the user's device
    And window.matchMedia("(display-mode: standalone)") returns true
    When the quote card finishes rendering
    Then the install prompt toast is NOT shown
    And the "installPromptEvent" is set to null

  Scenario: App is opened from iOS homescreen (standalone)
    Given the app is opened via an iOS Add-to-Home-Screen shortcut
    And window.navigator.standalone is true
    When the quote card finishes rendering
    Then the install prompt toast is NOT shown

  Scenario: User has permanently dismissed the prompt in a previous session
    Given "dawncast_install_dismissed_permanent" exists in localStorage with value "true"
    When the quote card finishes rendering
    Then the install prompt toast is NOT shown
    And the deferred "beforeinstallprompt" event is discarded

  Scenario: User is within a dismissal deferral window
    Given "dawncast_install_snoozed_until" exists in localStorage
    And the stored timestamp is in the future
    When the quote card finishes rendering
    Then the install prompt toast is NOT shown
    And the deferred prompt is retained for later

  Scenario: User's deferral window has elapsed
    Given "dawncast_install_snoozed_until" exists in localStorage
    And the stored timestamp is in the past
    When the quote card finishes rendering
    Then the install prompt toast appears as normal
    And the expired "dawncast_install_snoozed_until" key is cleared from localStorage
```

---

## Feature: Install Prompt UI — Sonner Toast

> The install prompt is implemented as a custom Sonner toast by Emil Kowalski.
> It must conform to the Dawncast design system defined in DESIGN.md.

```gherkin
Feature: Install Prompt UI — Sonner Toast
  As a first-time visitor who has just received their daily quote
  I want to see a beautiful, on-brand install prompt
  So that I am invited to add the app to my home screen in a non-disruptive way

  Background:
    Given the install prompt conditions are all met
    And the quote card is fully visible
    And 1500ms have elapsed since the quote card became visible

  # ── Visual appearance ─────────────────────────────────────────────────────

  Scenario: Toast renders in the bottom-right corner
    Then the Sonner <Toaster> component is mounted with position="bottom-right"
    And the toast appears within the bottom-right safe area of the viewport
    And the toast does not overlap the main quote card on desktop viewports
    And on mobile viewports the toast spans full width above the bottom edge

  Scenario: Toast visual design matches Dawncast design system
    Then the toast background color is oklch(1 0.007 76) (card-quote surface)
    And the toast border is 1px solid oklch(0.88 0.018 70) (border token)
    And the toast border-radius is 1.5rem (rounded-2xl token)
    And the toast box-shadow is 0 4px 24px oklch(0 0 0 / 0.06) (Ambient Glow)
    And the toast text uses DM Sans (body font family)
    And accent elements use oklch(0.68 0.178 64) (Sunrise Gold primary)

  Scenario: Toast content is correct and branded
    Then the toast displays the Dawncast app icon (16x16 favicon or 32x32 PNG)
    And a headline reads "Add Dawncast to your home screen"
    And a sub-label reads "Your daily quote, one tap away"
    And the sub-label uses the Label typography style (0.6875rem, 600, 0.1em tracking, uppercase)
    And an "Install" CTA button is shown styled as button-primary
    And a secondary "Not now" ghost link is shown to the right of the CTA

  Scenario: Toast has a manual close button
    Then a close icon button (×) is rendered in the top-right corner of the toast
    And it has an aria-label of "Dismiss install prompt"
    And clicking it dismisses the toast with the "snooze" deferral behavior

  Scenario: Toast entrance animation
    Then the toast slides up from the bottom-right using Sonner's default enter transition
    And the animation duration is 320ms
    And it uses an ease-out curve

  Scenario: Toast does not auto-dismiss
    Given the install prompt toast is visible
    When 10 seconds elapse without any user interaction
    Then the toast remains visible
    And it does NOT auto-dismiss on a timer
    And the duration prop on the Sonner toast is set to Infinity

  Scenario: Toast renders above other UI chrome
    Then the Sonner <Toaster> has a z-index sufficient to appear above the quote card
    And it appears below any full-screen modal overlays (e.g., AR mode, preferences)
    And the z-index value is coordinated with the app's z-index scale

  # ── Dark mode ─────────────────────────────────────────────────────────────

  Scenario: Toast adapts to dark mode
    Given the user has enabled Dark Mode in preferences
    Or the OS prefers-color-scheme is "dark"
    Then the toast background shifts to a dark surface token
    And the toast border uses a dark-mode-appropriate border color
    And text colors invert to oklch(0.96 0.010 76) (dark-foreground token)
    And the Sunrise Gold accent remains unchanged

  # ── Mobile viewport ───────────────────────────────────────────────────────

  Scenario: Toast layout adapts on narrow viewports
    Given the viewport width is less than 480px
    Then the toast stretches to full width minus 1rem horizontal margin on each side
    And it is anchored to the bottom of the viewport with a 1rem bottom offset
    And the "Install" and "Not now" buttons are arranged horizontally within the toast
    And the toast content does not require scrolling
```

---

## Feature: User Accepts Installation

> The user taps "Install" and the native PWA install dialog is triggered.

```gherkin
Feature: User Accepts Installation
  As a user who wants to install Dawncast
  I want tapping "Install" to immediately trigger the native install flow
  So that I can add the app to my home screen without friction

  Background:
    Given the install prompt toast is visible
    And the deferred "beforeinstallprompt" event is stored in context

  Scenario: User taps the "Install" button
    When the user taps the "Install" button on the toast
    Then the app calls prompt() on the deferred "beforeinstallprompt" event
    And the native browser install dialog is presented to the user
    And the Sonner toast is dismissed immediately upon prompt() being called

  Scenario: User confirms installation in the native dialog
    Given the native browser install dialog is open
    When the user taps "Install" or "Add to Home Screen" in the native dialog
    Then the app listens for the "appinstalled" event on window
    And upon receiving "appinstalled", sets "dawncast_install_dismissed_permanent" to "true" in localStorage
    And a new Sonner toast appears with the message "Dawncast added to your home screen 🌅"
    And that confirmation toast auto-dismisses after 4000ms
    And the "installPromptEvent" in context is set to null

  Scenario: User cancels the native install dialog
    Given the native browser install dialog is open
    When the user taps "Cancel" or dismisses the native dialog
    Then the app reads the userChoice.outcome from the resolved promise
    And since the outcome is "dismissed", the snooze deferral is applied
    And "dawncast_install_snoozed_until" is written to localStorage set 3 days from now
    And no confirmation toast is shown
    And the "installPromptEvent" is set to null (the event can only be used once)
```

---

## Feature: User Dismisses the Prompt

> The user declines the install prompt. The app must respect their choice.

```gherkin
Feature: User Dismisses the Prompt
  As a user who does not want to install right now
  I want to dismiss the install toast without penalty
  So that the app does not harass me on subsequent visits

  Background:
    Given the install prompt toast is visible

  Scenario: User taps the "Not now" link
    When the user taps "Not now"
    Then the Sonner toast is dismissed with its exit animation
    And "dawncast_install_snoozed_until" is written to localStorage
    And its value is the current timestamp plus 3 days (in milliseconds)
    And the user is returned to the uninterrupted quote view

  Scenario: User taps the close (×) button on the toast
    When the user taps the close icon button on the toast
    Then the behavior is identical to tapping "Not now"
    And "dawncast_install_snoozed_until" is set in localStorage with a 3-day window

  Scenario: User taps outside the toast (swipe-to-dismiss on mobile)
    Given the Sonner toast is configured with swipe-to-dismiss enabled
    When the user swipes the toast downward on a touch device
    Then the toast exits with a swipe animation
    And "dawncast_install_snoozed_until" is set with a 3-day deferral
    And the deferred "beforeinstallprompt" event is retained (not consumed)

  Scenario: User dismisses the prompt three or more times across separate sessions
    Given the user has dismissed the install prompt on two prior visits
    And "dawncast_install_dismiss_count" in localStorage equals 2
    When the user dismisses the install prompt again
    Then "dawncast_install_dismiss_count" is incremented to 3
    And "dawncast_install_dismissed_permanent" is set to "true" in localStorage
    And the install prompt will never be shown to this user again
    And "dawncast_install_snoozed_until" is cleared as it is now superseded
```

---

## Feature: Re-prompt Deferral Logic

> The app uses a localStorage-based state machine to manage re-prompt timing.

```gherkin
Feature: Re-prompt Deferral Logic
  As the application
  I want to re-invite users to install after a respectful delay
  So that the install offer remains available without being obnoxious

  Background:
    Given the user has previously snoozed the install prompt
    And "dawncast_install_snoozed_until" is present in localStorage
    And "dawncast_install_dismissed_permanent" is NOT set

  Scenario: User returns within the 3-day deferral window
    Given the current timestamp is before the value in "dawncast_install_snoozed_until"
    When the quote card finishes rendering
    Then the install prompt toast is NOT shown
    And no install-related UI is rendered

  Scenario: User returns after the 3-day deferral window has elapsed
    Given the current timestamp is after the value in "dawncast_install_snoozed_until"
    When the quote card finishes rendering
    Then "dawncast_install_snoozed_until" is removed from localStorage
    And the install prompt toast appears as normal after the 1500ms delay
    And the dismiss count in "dawncast_install_dismiss_count" is incremented by 1

  Scenario: localStorage is unavailable (private browsing or storage blocked)
    Given the browser throws an error when writing to localStorage
    When the install prompt conditions are otherwise met
    Then the install toast is shown for this session only
    And no localStorage writes are attempted
    And no re-prompt logic is applied for this session
    And on next visit, the prompt will show again as if it were a first visit
```

---

## Feature: Already Installed Guard

> Dawncast must never show the install prompt if it is already installed.

```gherkin
Feature: Already Installed Guard
  As a user who has already installed Dawncast
  I want the install prompt to never appear
  So that I am not shown a redundant invitation

  Background:
    Given the user opens Dawncast

  Scenario: App is running in standalone display mode (Android / desktop PWA)
    Given window.matchMedia("(display-mode: standalone)").matches is true
    When the app initializes
    Then the app sets "isPWAInstallable" to false
    And the Sonner <Toaster> for install is not mounted in the component tree
    And no install-related event listeners are attached

  Scenario: App is running as a standalone iOS Add-to-Home-Screen app
    Given window.navigator.standalone is true
    When the app initializes
    Then the app sets "isPWAInstallable" to false
    And the install toast is never queued

  Scenario: "appinstalled" event fires during the session (just installed)
    Given the user accepted the install in a prior step this session
    When the browser fires the "appinstalled" event
    Then the app removes the "beforeinstallprompt" event listener
    And sets "dawncast_install_dismissed_permanent" to "true" in localStorage
    And the install toast will not appear in any future session
```

---

## Feature: Browser Compatibility

> The install prompt must degrade gracefully on browsers that do not support PWA installation.

```gherkin
Feature: Browser Compatibility
  As a user on an unsupported browser
  I want the app to work normally without broken UI
  So that unsupported environments do not see a non-functional install prompt

  Background:
    Given the app is loaded in a browser

  Scenario: Browser supports PWA install (Chrome, Edge, Samsung Internet)
    Given the browser fires "beforeinstallprompt"
    Then the full install prompt flow is active as specified

  Scenario: Browser is Safari on iOS (no "beforeinstallprompt" support)
    Given the user is on Safari on iOS
    And the browser does not fire "beforeinstallprompt"
    And window.navigator.standalone is false (not yet installed)
    When the quote card finishes rendering
    Then the standard install toast is NOT shown
    And instead, an iOS-specific hint toast appears at the bottom-right
    And it reads "Add to Home Screen via Safari's Share button (↑)"
    And this iOS hint toast auto-dismisses after 7000ms
    And it is only shown once per session, gated by "dawncast_ios_hint_shown" in sessionStorage

  Scenario: Browser is Firefox on desktop (no "beforeinstallprompt" support)
    Given the user is on Firefox desktop
    And the browser does not fire "beforeinstallprompt"
    When the quote card finishes rendering
    Then no install prompt UI is shown
    And the experience is identical to a user who has permanently dismissed the prompt

  Scenario: "beforeinstallprompt" support is detected via feature check
    Given the app initializes
    Then it attaches a "beforeinstallprompt" listener immediately on window
    And if the event does not fire within 5 seconds of DOMContentLoaded
    Then "isPWAInstallable" remains false
    And the install toast is never scheduled
```

---

## Feature: Install Prompt Accessibility

> The install prompt toast must be usable by all users regardless of ability.

```gherkin
Feature: Install Prompt Accessibility
  As a user with accessibility needs
  I want the install prompt to be fully accessible
  So that I can decide whether to install the app without barriers

  Background:
    Given the install prompt toast is visible

  Scenario: Toast is announced by screen readers
    Then the Sonner toast container has role="status" or aria-live="polite"
    And when the toast appears, the screen reader announces "Add Dawncast to your home screen"
    And the full toast content is readable by assistive technology

  Scenario: All interactive toast elements are keyboard-navigable
    Given the user is navigating with a keyboard
    When the toast appears
    Then focus is NOT automatically moved to the toast (it is non-blocking)
    And the user can Tab to the toast's "Install" button
    And the user can Tab to the "Not now" link
    And the user can Tab to the close (×) button
    And pressing Enter or Space on any of these elements triggers the correct action

  Scenario: Close button has an accessible label
    Then the close icon button has aria-label="Dismiss install prompt"
    And it is not labeled solely by its visual × icon

  Scenario: Toast does not trap focus
    Given the user has tabbed into the install toast
    When the user continues pressing Tab
    Then focus moves naturally to the next focusable element in the document
    And the user is not trapped within the toast

  Scenario: Toast respects reduced motion preferences
    Given the OS or browser reports prefers-reduced-motion: reduce
    When the install toast appears
    Then the slide-in entrance animation is disabled
    And the toast appears instantly without motion
    And Sonner's toastOptions includes a reduced-motion override via CSS media query
```

---

## Implementation Notes

### localStorage Key Reference

| Key | Type | Purpose |
|---|---|---|
| `dawncast_install_dismissed_permanent` | `"true"` / absent | User has permanently opted out |
| `dawncast_install_snoozed_until` | Unix timestamp (ms) | Timestamp after which re-prompt is allowed |
| `dawncast_install_dismiss_count` | Integer string | Running total of snooze dismissals |

### sessionStorage Key Reference

| Key | Type | Purpose |
|---|---|---|
| `dawncast_ios_hint_shown` | `"true"` / absent | Prevents iOS hint from repeating within a session |

### Deferral State Machine

```
[First Visit]
    │
    ▼
[beforeinstallprompt captured?] ── No ──► [No prompt shown]
    │ Yes
    ▼
[Quote visible + 1500ms elapsed]
    │
    ▼
[Permanent dismiss flag set?] ── Yes ──► [No prompt shown]
    │ No
    ▼
[Within snooze window?] ── Yes ──► [No prompt shown]
    │ No
    ▼
[Show Sonner toast]
    │
    ├──► [User taps "Install"] ──► [prompt()] ──► [Accepted: set permanent flag]
    │                                          └──► [Cancelled: snooze 3 days]
    │
    └──► [User dismisses] ──► [dismiss_count < 3: snooze 3 days]
                           └──► [dismiss_count ≥ 3: set permanent flag]
```

### Sonner Configuration Reference

```tsx
// apps/web/src/components/InstallPromptToaster.tsx
<Toaster
  position="bottom-right"
  toastOptions={{
    duration: Infinity,
    classNames: {
      toast: "dawncast-install-toast",
    },
  }}
  expand={false}
  richColors={false}
/>
```

---

*Document generated for: Dawncast — Weather-Aware Motivational PWA*
*Spec format: Gherkin BDD (Cucumber-compatible)*
*Feature: PWA Install Prompt*
*Last updated: 2026-05-18*
