import path from "node:path";

import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// Cross-browser nightly gate config.
// Runs retained-surface-smoke.spec.ts against Firefox and WebKit only.
// The primary PR gate (playwright.config.ts) continues to use Chromium — this config
// is intentionally separate so that adding Firefox/WebKit here does not force those
// browsers into the Chromium-only PR gate scripts.

dotenv.config({ path: path.join(__dirname, ".env") });

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.SMOKE_BASE_URL ??
  "http://127.0.0.1:3000";
const resolvedBaseUrl = new URL(baseURL);
const shouldManageServer = process.env.PLAYWRIGHT_MANAGE_SERVER === "1";
const webServerPort =
  resolvedBaseUrl.port || (resolvedBaseUrl.protocol === "https:" ? "443" : "80");
// Cross-browser gate uses dev mode: no build step required, sufficient for rendering
// compatibility checks. Production-build semantics are guarded by the Chromium PR gate.
const webServerCommand = [
  "npx",
  "next",
  "dev",
  "--hostname",
  resolvedBaseUrl.hostname,
  "--port",
  webServerPort,
].join(" ");

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "retained-surface-smoke.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: path.join(__dirname, "output/playwright/test-results"),
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: path.join(
          __dirname,
          "output/playwright/smoke/cross-browser-smoke-report.json",
        ),
      },
    ],
    [
      "html",
      {
        outputFolder: path.join(__dirname, "output/playwright/cross-browser-report"),
        open: "never",
      },
    ],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
    viewport: { width: 1440, height: 1100 },
  },
  projects: [
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: shouldManageServer
    ? {
        command: webServerCommand,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "pipe",
        stderr: "pipe",
      }
    : undefined,
});
