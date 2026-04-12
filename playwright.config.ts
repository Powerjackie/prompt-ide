import path from "node:path";

import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

dotenv.config({ path: path.join(__dirname, ".env") });

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.SMOKE_BASE_URL ??
  "http://127.0.0.1:3000";
const resolvedBaseUrl = new URL(baseURL);
const shouldManageServer = process.env.PLAYWRIGHT_MANAGE_SERVER === "1";
const serverMode = process.env.PLAYWRIGHT_SERVER_MODE === "prod" ? "prod" : "dev";
const webServerPort =
  resolvedBaseUrl.port || (resolvedBaseUrl.protocol === "https:" ? "443" : "80");
const webServerCommand =
  serverMode === "prod"
    ? ["npx", "next", "start", "--hostname", resolvedBaseUrl.hostname, "--port", webServerPort].join(" ")
    : ["npx", "next", "dev", "--hostname", resolvedBaseUrl.hostname, "--port", webServerPort].join(" ");

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
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
      { outputFile: path.join(__dirname, "output/playwright/smoke/smoke-report.json") },
    ],
    [
      "html",
      { outputFolder: path.join(__dirname, "output/playwright/report"), open: "never" },
    ],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: process.env.PLAYWRIGHT_HEADED === "1" ? false : true,
    viewport: { width: 1440, height: 1100 },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
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
