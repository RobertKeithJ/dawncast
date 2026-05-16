---
name: Dawncast
description: A weather-aware motivational PWA with enterprise-grade serenity.
colors:
  primary: oklch(0.68 0.178 64)
  primary-foreground: oklch(0.99 0.004 76)
  background: oklch(0.98 0.012 76)
  foreground: oklch(0.16 0.025 54)
  accent: oklch(0.66 0.198 37)
  accent-foreground: oklch(0.99 0.004 76)
  dark-background: oklch(0.12 0.038 264)
  dark-foreground: oklch(0.96 0.010 76)
  muted: oklch(0.93 0.015 70)
  muted-foreground: oklch(0.50 0.022 60)
  border: oklch(0.88 0.018 70)
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.1em"
rounded:
  sm: "0.375rem"
  md: "0.625rem"
  lg: "1rem"
  xl: "1.25rem"
  "2xl": "1.5rem"
  "4xl": "2rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0.625rem 1.25rem"
  card-quote:
    backgroundColor: "oklch(1 0.007 76)"
    rounded: "{rounded.2xl}"
    padding: "2rem 2rem 1.5rem"
---

# Design System: Dawncast

## 1. Overview

**Creative North Star: "The Serene Sentinel"**

Dawncast is a "Serene Sentinel" for the user's daily journey—a structured, reliable presence that stands watch over the day's changing light. It balances professional "enterprise-y" precision with a light, ethereal atmosphere. The system is designed to provide a "breath before action," using high-quality typography and adaptive color to ground the user in their current environment.

It explicitly rejects the over-stimulating "SaaS dashboard" aesthetic in favor of a quiet, focused ritual.

**Key Characteristics:**
- **Atmospheric Resonance**: Visuals shift their anchor based on the user's local weather.
- **Enterprise Precision**: Tight spacing, disciplined scales, and structured layouts.
- **Ethereal Calm**: Uses light shadows, glass-like blurs, and wide tracking for a feeling of space.

## 2. Colors

A sophisticated palette that tints neutrals toward a warm, human hue while utilizing "Sunrise Gold" for primary actions.

### Primary
- **Sunrise Gold** (oklch(0.68 0.178 64)): The primary beacon of energy. Used for call-to-actions and brand accents.

### Neutral
- **Warm Cream** (oklch(0.98 0.012 76)): The base surface. A tinted neutral that feels softer than white.
- **Warm Charcoal** (oklch(0.16 0.025 54)): Primary text color. Deep enough for contrast but tinted to stay within the "Warm" family.
- **Indigo Midnight** (oklch(0.12 0.038 264)): The anchor for Dark Mode and nocturnal atmospheric states.

### Named Rules
**The Environmental Pulse Rule.** Background and primary colors must adjust to the current weather condition (Sunny, Rainy, Stormy, etc.) to validate the user's physical environment.

## 3. Typography

**Display Font:** Cormorant Garamond (with Georgia, serif)
**Body Font:** DM Sans (with system-ui, sans-serif)

**Character:** A classic editorial pairing. The serif display font provides the soul and "breath" of the quote, while the geometric sans provides the structural "enterprise" reliability of the app UI.

### Hierarchy
- **Display** (400, clamp(1.5rem, 4vw, 2.25rem), 1.35): Used exclusively for the quote text. Always italicized.
- **Body** (400, 0.875rem, 1.5): Used for general UI text and descriptions.
- **Label** (600, 0.6875rem, 0.1em): Used for tone badges and small metadata. Always uppercase with wide tracking.

### Named Rules
**The Quote Breathing Rule.** Quote text must never exceed a 65ch line length and should be centered to maintain an "editorial" feel.

## 4. Elevation

The system uses a "Light and Ethereal" approach to depth. Shadows are used rarely and with extreme diffusion to suggest presence without adding visual "noise."

### Shadow Vocabulary
- **Ambient Glow** (0 4px 24px oklch(0 0 0 / 0.06)): A subtle, diffuse shadow used for the main quote card to separate it from the atmospheric background.

### Named Rules
**The State-Only Elevation Rule.** Surfaces are primarily separated by tonal shifts and borders. Physical elevation (shadows) should only be used for the central quote card or active UI states.

## 5. Components

### Buttons
- **Shape:** Rounded Large (1rem radius)
- **Primary:** Sunrise Gold with a soft glow shadow.
- **Ghost:** Transparent background with a subtle border and warm charcoal text.

### Quote Card
- **Shape:** Rounded 2XL (1.5rem radius)
- **Style:** A refined container with a subtle ambient glow and an internal radial "weather glow" that hints at the current atmosphere.

### Weather Badges
- **Style:** Pill-shaped (4XL radius) with a muted background and subtle border. Used to anchor the quote to the physical location.

## 6. Do's and Don'ts

### Do:
- **Do** use OKLCH for all color definitions to ensure perceptual uniformity.
- **Do** prioritize legibility and "breath" by keeping quote text uncluttered.
- **Do** use the "Enterprise-y" geometric sans for all functional UI elements.

### Don't:
- **Don't** use loud, high-contrast "SaaS" gradients that break the calm.
- **Don't** use "Pinterest-style" overly-sentimental script fonts.
- **Don't** use sharp, 90-degree corners; maintain a friendly, rounded radius of at least 1rem for main containers.
