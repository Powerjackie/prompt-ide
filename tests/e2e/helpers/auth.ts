import crypto from "node:crypto";

import type { Page } from "@playwright/test";

export type AuthRole = "admin" | "member";

function getRequiredEnv(name: "ADMIN_PASSWORD" | "MEMBER_PASSWORD") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} in environment.`);
  }

  return value;
}

export function buildAuthToken(role: AuthRole) {
  const secret =
    role === "admin" ? getRequiredEnv("ADMIN_PASSWORD") : getRequiredEnv("MEMBER_PASSWORD");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`prompt-ide-auth-v2:${role}`)
    .digest("hex");

  return `${role}.${signature}`;
}

export async function setAuthRole(page: Page, role: AuthRole) {
  const baseURL =
    process.env.PLAYWRIGHT_BASE_URL ??
    process.env.SMOKE_BASE_URL ??
    "http://127.0.0.1:3000";

  await page.context().clearCookies();
  await page.context().addCookies([
    {
      name: "auth_token",
      value: buildAuthToken(role),
      url: baseURL,
    },
  ]);
}
