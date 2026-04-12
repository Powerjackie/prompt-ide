import { expect, test } from "@playwright/test";

const TRACKED = new Set(["CLS", "FCP", "INP", "LCP", "TTFB"]);

test("web vitals reporter exposes tracked metrics on window", async ({ page }) => {
  await page.goto("/zh");

  await page.waitForFunction(
    () => Array.isArray(window.__PROMPT_IDE_WEB_VITALS__) && window.__PROMPT_IDE_WEB_VITALS__.length > 0,
    undefined,
    { timeout: 20_000 }
  );

  const metricNames = await page.evaluate(() =>
    ((window as { __PROMPT_IDE_WEB_VITALS__?: Array<{ name: string }> }).__PROMPT_IDE_WEB_VITALS__ ?? []).map(
      (metric) => metric.name
    )
  );

  expect(metricNames.length).toBeGreaterThan(0);
  expect(metricNames.some((name) => TRACKED.has(name))).toBeTruthy();
});
