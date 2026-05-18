# iOS Install Hint Toast — Gherkin Feature Spec
**Feature:** iOS Safari "Add to Home Screen" Hint Toast
**App:** Dawncast — Weather-Aware Motivational PWA
**Context:** iOS Safari does not fire `beforeinstallprompt`. Installation requires
the user to open Safari's **native** share sheet — not the in-app Web Share API.
This spec covers the hint toast that guides users through that distinction.
**Format:** BDD Feature Specifications (Gherkin / Cucumber-compatible)

---

## Table of Contents

1. [Trigger Conditions](#feature-ios-hint-toast--trigger-conditions)
2. [Toast UI & Copy](#feature-ios-hint-toast--ui-and-copy)
3. [Share Button Disambiguation](#feature-ios-hint-toast--share-button-disambiguation)
4. [Dismissal & Suppression](#feature-ios-hint-toast--dismissal-and-suppression)
5. [Accessibility](#feature-ios-hint-toast--accessibility)

---

## Feature: iOS Hint Toast — Trigger Conditions

> The hint toast must only appear on iOS Safari, only when the app is not yet
> installed, and only after the user has seen the quote — never on a loading
> or empty screen.

```gherkin
Feature: iOS Hint Toast — Trigger Conditions
  As a first-time visitor on iOS Safari
  I want to be shown a clear, specific hint about how to install Dawncast
  So that I don't accidentally tap the wrong Share button and get confused

  Background:
    Given the user is on an iPhone or iPad
    And the browser is Safari (not Chrome, Firefox, or an in-app browser)
    And the app is NOT running in standalone mode
    And window.navigator.standalone is false
    And "dawncast_ios_hint_shown_session" does NOT exist in sessionStorage
    And "dawncast_install_dismissed_permanent" does NOT exist in localStorage

  Scenario: iOS Safari detected — hint toast is queued after quote renders
    Given the browser does not fire a "beforeinstallprompt" event
    And /iPad|iPhone|iPod/.test(navigator.userAgent) is true
    When the daily quote card finishes its entrance animation
    And 1500ms elapse
    Then the iOS hint toast is shown at the bottom of the viewport
    And it spans full width minus 1rem margin on each side
    And it is anchored 1rem above the bottom edge of the viewport

  Scenario: "beforeinstallprompt" fires — iOS hint is suppressed
    Given the browser fires a "beforeinstallprompt" event
    When the quote card finishes rendering
    Then the standard install prompt toast is shown instead
    And the iOS hint toast is NOT shown

  Scenario: App is already installed (standalone mode)
    Given window.navigator.standalone is true
    When the app initializes
    Then neither the iOS hint toast nor the install prompt toast is shown
    And no install-related UI is mounted in the component tree

  Scenario: User is on iOS but inside an in-app browser (Facebook, Instagram, Mail)
    Given the user opened Dawncast from a link inside another app
    And the browser context is an in-app WebView, not full Safari
    When the quote card finishes rendering
    Then the iOS hint toast is NOT shown
    And instead a different notice appears reading:
      "For the best experience, open this in Safari"
    And that notice includes a button labeled "Open in Safari"
    And tapping it calls window.open(location.href, '_blank') to hand off to Safari

  Scenario: User has permanently dismissed the hint in a prior session
    Given "dawncast_install_dismissed_permanent" is set to "true" in localStorage
    When the quote card finishes rendering
    Then the iOS hint toast is NOT shown

  Scenario: User has already seen the hint this session
    Given "dawncast_ios_hint_shown_session" is set to "true" in sessionStorage
    When the user navigates away and back within the same session
    Then the iOS hint toast is NOT shown again
    And the sessionStorage key is not re-written
```

---

## Feature: iOS Hint Toast — UI and Copy

> The toast must use Dawncast design tokens and contain copy that is specific
> enough for a user to act on without any prior knowledge of PWAs.

```gherkin
Feature: iOS Hint Toast — UI and Copy
  As a first-time iOS Safari visitor
  I want the install hint to be visually clear and instantly actionable
  So that I know exactly what to tap without having to think about it

  Background:
    Given the iOS hint toast trigger conditions are all met
    And the toast is visible at the bottom of the viewport

  # ── Copy ────────────────────────────────────────────────────────────────

  Scenario: Toast displays correct headline
    Then the toast headline reads "Add Dawncast to your Home Screen"
    And it uses the body font (DM Sans, 0.875rem, weight 400)

  Scenario: Toast displays a step-by-step instruction line
    Then below the headline, an instruction line reads:
      "Tap Safari's        button below, then 'Add to Home Screen'"
    And the gap between "Safari's" and "button" is filled with
      an inline SVG of the Safari share icon (square with upward arrow)
    And the SVG icon is 16x16px
    And it is vertically aligned to the text baseline
    And it uses the foreground color token oklch(0.16 0.025 54) in light mode
    And it uses the dark-foreground token oklch(0.96 0.010 76) in dark mode

  Scenario: Toast does NOT mention the in-app Share button
    Then the toast copy contains no reference to "the Share button in the app"
    And it contains no reference to the Share icon rendered inside Dawncast's UI
    And the word "below" in the instruction refers unambiguously to the
      Safari browser chrome at the bottom of the screen, not the app's toolbar

  Scenario: Toast displays a clarifying sub-label
    Then below the instruction line, a sub-label reads:
      "USE SAFARI'S BROWSER BAR — NOT THE SHARE BUTTON IN THE APP"
    And it uses the Label typography style:
      font-size 0.6875rem, weight 600, letter-spacing 0.1em, uppercase
    And its color is the muted-foreground token oklch(0.50 0.022 60)

  # ── Visual design ────────────────────────────────────────────────────────

  Scenario: Toast visual design matches Dawncast design system
    Then the toast background is the card-quote surface oklch(1 0.007 76)
    And the toast border is 1px solid oklch(0.88 0.018 70)
    And the toast border-radius is 1.5rem (rounded-2xl)
    And the toast box-shadow is 0 4px 24px oklch(0 0 0 / 0.06) (Ambient Glow)

  Scenario: Toast includes a close button
    Then a close icon (×) button is rendered in the top-right corner
    And it has aria-label="Dismiss install hint"
    And tapping it dismisses the toast and applies permanent suppression

  Scenario: Toast does NOT include a CTA install button
    Then the toast contains no "Install" button
    And the toast contains no call-to-action that triggers navigator.share()
    And the only interactive elements are the close (×) button

  Scenario: Toast does not auto-dismiss
    Given the iOS hint toast is visible
    When 30 seconds elapse without any user interaction
    Then the toast remains visible
    And the Sonner duration prop is set to Infinity

  Scenario: Toast adapts to dark mode
    Given the user has enabled Dark Mode or the OS prefers dark color scheme
    Then the toast background shifts to a dark surface
    And text color uses oklch(0.96 0.010 76) (dark-foreground token)
    And the inline Safari share icon SVG color updates to match
    And the Sunrise Gold accent oklch(0.68 0.178 64) remains unchanged

  Scenario: Toast respects reduced motion
    Given prefers-reduced-motion is set to "reduce"
    When the toast appears
    Then it renders instantly without any slide-in animation
    And Sonner's reduced-motion override is applied via CSS media query
```

---

## Feature: iOS Hint Toast — Share Button Disambiguation

> This is the core UX problem: users tap Dawncast's in-app Share button and
> never find "Add to Home Screen." The toast must make the distinction
> between the two Share buttons unambiguous.

```gherkin
Feature: iOS Hint Toast — Share Button Disambiguation
  As a user who sees both a Share button in the app and Safari's Share button
  I want to understand exactly which one to tap
  So that I don't end up in the wrong share sheet and give up

  Background:
    Given the iOS hint toast is visible
    And the user can see both:
      - Dawncast's in-app "Share" button in the bottom action bar
      - Safari's native share button (↑) in the browser chrome below the app

  Scenario: User taps Dawncast's in-app Share button after reading the hint
    Given the hint toast is visible
    When the user taps the "Share" button inside Dawncast's UI
    Then the Web Share API share sheet opens (navigator.share())
    And "Add to Home Screen" does NOT appear in that share sheet (iOS platform behavior)
    And the hint toast remains visible underneath the share sheet
    And when the share sheet is dismissed, the toast is still present
    And no additional warning or error is shown

  Scenario: Inline Safari share icon in toast copy is rendered correctly
    Then the inline SVG icon within the toast instruction text
      matches Apple's standard "share" glyph: a square with an arrow pointing up
    And it is NOT the Dawncast app's own share icon
    And it is NOT a generic link icon or external-link icon
    And a sighted user can match it visually to the Safari browser chrome button

  Scenario: Toast copy references "Safari's button below" not "the share button"
    Then the phrase "the Share button" does NOT appear anywhere in the toast
    And the phrase "Safari's" DOES appear in the instruction line
    And the phrase "browser bar" DOES appear in the sub-label
    So that users understand the target is in the browser chrome, not the app UI

  Scenario: User follows the hint correctly — taps Safari's native share button
    Given the user reads the toast and taps Safari's native share button
      in the browser toolbar at the bottom of the screen
    Then the native iOS share sheet opens
    And "Add to Home Screen" is present in that sheet (after scrolling if needed)
    And the user can proceed to install Dawncast independently
    And Dawncast has no programmatic visibility into whether they complete it
```

---

## Feature: iOS Hint Toast — Dismissal and Suppression

> Dismissal must be permanent — this hint should never nag the user.

```gherkin
Feature: iOS Hint Toast — Dismissal and Suppression
  As a user who has seen the iOS install hint
  I want it to go away permanently if I dismiss it
  So that I am never shown the same nudge twice

  Background:
    Given the iOS hint toast is visible

  Scenario: User taps the close (×) button
    When the user taps the close button
    Then the toast exits with Sonner's default dismiss animation
    And "dawncast_install_dismissed_permanent" is set to "true" in localStorage
    And "dawncast_ios_hint_shown_session" is set to "true" in sessionStorage
    And on all future visits the iOS hint toast will never be shown again

  Scenario: User swipes the toast downward (touch dismiss)
    Given the Sonner toast has swipe-to-dismiss enabled
    When the user swipes the toast downward
    Then the toast exits with a swipe animation
    And "dawncast_install_dismissed_permanent" is set to "true" in localStorage
    And the suppression behavior is identical to tapping ×

  Scenario: Session ends without the user dismissing the toast
    Given the user closes Safari without dismissing the toast
    When the user reopens Dawncast in a new Safari session
    Then "dawncast_ios_hint_shown_session" no longer exists (sessionStorage cleared)
    And "dawncast_install_dismissed_permanent" does not exist (was never written)
    And the iOS hint toast appears again after the quote renders

  Scenario: User installs the app via Safari's native flow (undetectable by app)
    Given the user followed the hint and added Dawncast to their home screen
    And then opens Dawncast from the home screen icon
    Then window.navigator.standalone is true
    And the iOS hint toast trigger condition fails at the standalone check
    And the toast is never shown in the installed context
```

---

## Feature: iOS Hint Toast — Accessibility

```gherkin
Feature: iOS Hint Toast — Accessibility
  As a user with accessibility needs on iOS Safari
  I want the install hint toast to be fully accessible
  So that I can act on it regardless of how I interact with my device

  Background:
    Given the iOS hint toast is visible

  Scenario: Toast is announced by VoiceOver
    Then the Sonner toast container has role="status" and aria-live="polite"
    And when the toast appears, VoiceOver announces:
      "Add Dawncast to your Home Screen.
       Tap Safari's share button below, then Add to Home Screen."
    And the inline SVG share icon has aria-label="Safari share button icon"
      so VoiceOver reads it as part of the sentence rather than skipping it

  Scenario: Inline SVG icon does not confuse screen readers
    Then the inline SVG has role="img" and aria-label="Safari share button icon"
    And it is NOT aria-hidden (it is semantically meaningful in context)
    And VoiceOver reads the full instruction as a coherent sentence

  Scenario: Close button is keyboard and VoiceOver accessible
    Then the close (×) button has aria-label="Dismiss install hint"
    And it is reachable via VoiceOver swipe navigation
    And double-tapping it with VoiceOver active dismisses the toast

  Scenario: Toast does not trap VoiceOver focus
    Given the user is navigating with VoiceOver
    When VoiceOver focus enters the toast
    Then the user can swipe past the toast to continue interacting with the app
    And VoiceOver is not locked inside the toast container
```

---

## Implementation Notes

### Key behavioral rule
`navigator.share()` (the Web Share API) **never** surfaces "Add to Home Screen"
on iOS. This is an Apple platform constraint, not a bug. The hint toast must
therefore direct users to Safari's **browser chrome** share button exclusively.

### Detection snippet

```ts
// apps/web/src/lib/install-utils.ts

export function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isWebKit = /WebKit/.test(ua);
  const isInAppBrowser = /CriOS|FxiOS|EdgiOS|GSA|FBAN|FBAV/.test(ua);
  return isIOS && isWebKit && !isInAppBrowser;
}

export function isStandalone(): boolean {
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

export function shouldShowIOSHint(): boolean {
  if (!isIOSSafari()) return false;
  if (isStandalone()) return false;
  if (sessionStorage.getItem('dawncast_ios_hint_shown_session')) return false;
  if (localStorage.getItem('dawncast_install_dismissed_permanent')) return false;
  return true;
}
```

### Inline Safari share icon SVG

```tsx
// Use this inline within the toast instruction text
// to visually match the Safari browser chrome button

const SafariShareIcon = () => (
  <svg
    role="img"
    aria-label="Safari share button icon"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'inline', verticalAlign: 'text-bottom', margin: '0 2px' }}
  >
    {/* Square with upward arrow — matches iOS Share glyph */}
    <path
      d="M8 1v9M5 4l3-3 3 3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 7v6h10V7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
```

### Toast copy reference

```
Headline:     "Add Dawncast to your Home Screen"
Instruction:  "Tap Safari's [↑] button below, then 'Add to Home Screen'"
Sub-label:    "USE SAFARI'S BROWSER BAR — NOT THE SHARE BUTTON IN THE APP"
```

### sessionStorage / localStorage keys

| Key | Store | Value | Written when |
|---|---|---|---|
| `dawncast_ios_hint_shown_session` | sessionStorage | `"true"` | Toast becomes visible |
| `dawncast_install_dismissed_permanent` | localStorage | `"true"` | User taps × or swipes away |

---

*Document generated for: Dawncast — Weather-Aware Motivational PWA*
*Spec format: Gherkin BDD (Cucumber-compatible)*
*Feature: iOS Safari Install Hint Toast*
*Last updated: 2026-05-18*
