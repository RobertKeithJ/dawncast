import { test, expect } from "@playwright/test";

test("home page loads and shows the app", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Daily Motivation|Dawncast/i);
});

test("shows loading state or content on home", async ({ page }) => {
  await page.goto("/");
  // Either a loading indicator or the main quote card should appear
  const hasLoader = await page.locator(".dc-loading").isVisible().catch(() => false);
  const hasCard = await page.locator(".dc-quote-card").isVisible().catch(() => false);
  const hasLocationPrompt = await page.locator("text=Location Access Denied").isVisible().catch(() => false);
  expect(hasLoader || hasCard || hasLocationPrompt).toBeTruthy();
});
