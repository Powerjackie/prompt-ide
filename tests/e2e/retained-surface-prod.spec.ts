import { expect, test, type Page } from "@playwright/test";

import { setAuthRole } from "./helpers/auth";

type ExistingPromptState = {
  id: string;
  modelText: string;
  statusText: string;
};

function attachConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });

  return () => {
    expect(errors, `Unexpected console errors: ${errors.join("\n")}`).toEqual([]);
  };
}

async function openRoute(page: Page, url: string, waitSelector = "body", timeout = 20_000) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.locator(waitSelector).first().waitFor({ state: "visible", timeout });
}

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;

    return {
      width: window.innerWidth,
      maxWidth: Math.max(doc.scrollWidth, body ? body.scrollWidth : 0),
    };
  });

  expect(
    overflow.maxWidth,
    `${label} has horizontal overflow: ${overflow.maxWidth} > ${overflow.width}`,
  ).toBeLessThanOrEqual(overflow.width + 1);
}

async function resetAdminToDefault(page: Page) {
  await openRoute(page, "/zh/admin", "#admin-reset-trigger");
  await page.locator("#admin-reset-trigger").click();
  await page.locator("#admin-reset-confirm").click();

  await page.waitForFunction(() => {
    const model = document.querySelector("#admin-default-model");
    const view = document.querySelector("#admin-default-view");
    const status = document.querySelector("#admin-default-status");
    const confidence = document.querySelector("#agent-confidence");
    const modelText = model?.textContent ?? "";
    const viewText = view?.textContent ?? "";
    const statusText = status?.textContent ?? "";

    return (
      confidence instanceof HTMLInputElement &&
      /Universal|\u901a\u7528/i.test(modelText) &&
      /Card|\u5361\u7247/i.test(viewText) &&
      /Inbox|\u6536\u4ef6\u7bb1/i.test(statusText) &&
      confidence.value === "0.7"
    );
  });
}

test.describe("retained-surface production acceptance", () => {
  let prompt: ExistingPromptState;
  let adminStateDirty = false;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await context.newPage();

    await setAuthRole(page, "admin");
    await openRoute(page, "/zh/prompts", "body");

    const promptHref = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
      return (
        anchors.find((anchor) => /\/zh\/prompts\/[^/]+$/.test(anchor.getAttribute("href") ?? ""))?.getAttribute(
          "href",
        ) ?? null
      );
    });

    if (!promptHref) {
      throw new Error("No retained prompt detail link was found on /zh/prompts.");
    }

    const id = promptHref.split("/").pop();
    if (!id) {
      throw new Error(`Failed to derive prompt id from href '${promptHref}'.`);
    }

    await openRoute(page, `/zh/editor/${id}`, "#editor-model");
    const modelText = (await page.locator("#editor-model").textContent())?.trim() ?? "";
    const statusText = (await page.locator("#editor-status").textContent())?.trim() ?? "";

    if (!modelText || !statusText) {
      throw new Error("Failed to capture existing editor model/status text for production baseline.");
    }

    prompt = { id, modelText, statusText };
    await context.close();
  });

  test.afterEach(async ({ page }) => {
    if (!adminStateDirty) {
      return;
    }

    await setAuthRole(page, "admin");
    await page.setViewportSize({ width: 1440, height: 1100 });
    await resetAdminToDefault(page);
    adminStateDirty = false;
  });

  test("admin retained routes and command palette stay healthy in production mode", async ({ page }) => {
    const assertNoConsoleErrors = attachConsoleErrors(page);
    await setAuthRole(page, "admin");

    await openRoute(page, "/zh", ".home-hero__title");
    await expect(page.locator(".home-hero__title")).toContainText(/PROMPT OPERATIONS|\u63d0\u793a\u8bcd\u8fd0\u8425/i);

    await page.getByRole("button", { name: /Search prompts|\u641c\u7d22\u63d0\u793a\u8bcd/i }).click();
    await page.locator("[data-slot='dialog-content']").waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("[data-slot='command-item']").filter({ hasText: /Docs|\u6587\u6863/i }).first().click();
    await page.waitForURL((url) => /\/docs$/.test(url.pathname));

    await openRoute(page, "/zh/docs", "h1");
    await expect(page.locator("body")).toContainText(/Admin|\/admin/i);

    await page.getByRole("button", { name: /Search prompts|\u641c\u7d22\u63d0\u793a\u8bcd/i }).click();
    await page.locator("[data-slot='dialog-content']").waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("[data-slot='command-item']").filter({ hasText: /Admin|\u7ba1\u7406/i }).first().click();
    await page.waitForURL((url) => /\/admin$/.test(url.pathname));

    await openRoute(page, "/zh/admin", "#admin-default-model");
    await expect(page.locator("#admin-export-copy")).toBeVisible();
    await expect(page.locator("#admin-export-download")).toBeVisible();
    await expect(page.locator("#admin-import-text")).toBeVisible();
    await expect(page.locator("#admin-diagnostics")).toBeVisible();

    await openRoute(page, "/zh/prompts", "body");
    expect(await page.locator(".prompt-library-item").count()).toBeGreaterThan(0);

    await openRoute(page, "/zh/editor", "#editor-model");
    await expect(page.locator("#editor-model")).toBeVisible();

    await openRoute(page, "/zh/playground", ".playground-stage-textarea");
    await page.locator(".playground-template").first().click();
    await expect(page.getByRole("button", { name: /Analyze|\u5206\u6790/i }).first()).toBeEnabled();

    await page.setViewportSize({ width: 390, height: 844 });
    await openRoute(page, "/zh/admin", "h1");
    await assertNoHorizontalOverflow(page, "Production mobile admin");

    assertNoConsoleErrors();
  });

  test("settings-backed contracts hold in production mode", async ({ page }) => {
    const assertNoConsoleErrors = attachConsoleErrors(page);
    await setAuthRole(page, "admin");

    await openRoute(page, "/zh/admin", "#admin-default-model");
    adminStateDirty = true;

    await page.locator("#admin-default-model").click();
    await page.getByRole("option", { name: /DeepSeek/i }).first().click();
    await page.locator("#admin-default-view").click();
    await page.getByRole("option", { name: /List|\u5217\u8868/i }).first().click();
    await page.locator("#admin-default-status").click();
    await page.getByRole("option", { name: /Production|\u751f\u4ea7/i }).first().click();
    await page.locator("#admin-workspace-save").click();
    await expect(page.locator("#admin-diagnostics")).toContainText(/DeepSeek/i, { timeout: 20_000 });
    await expect(page.locator("#admin-diagnostics")).toContainText(/List|\u5217\u8868/i);

    const verificationPage = await page.context().newPage();
    const assertVerificationConsoleErrors = attachConsoleErrors(verificationPage);

    await openRoute(verificationPage, "/zh/admin", "#admin-default-model");
    await expect(verificationPage.locator("#admin-export-copy")).toBeVisible();
    await expect(verificationPage.locator("#admin-diagnostics")).toBeVisible();
    await expect(verificationPage.locator("#admin-default-model")).toContainText(/DeepSeek/i);
    await expect(verificationPage.locator("#admin-default-view")).toContainText(/List|\u5217\u8868/i);
    await expect(verificationPage.locator("#admin-default-status")).toContainText(/Production|\u751f\u4ea7/i);

    await openRoute(verificationPage, "/zh/prompts", "body");
    await expect(verificationPage.locator(".prompt-draggable-card")).toHaveCount(0);

    await openRoute(verificationPage, "/zh/editor", "#editor-model");
    await expect(verificationPage.locator("#editor-model")).toContainText(/DeepSeek/i);
    await expect(verificationPage.locator("#editor-status")).toContainText(/Production|\u751f\u4ea7/i);

    await openRoute(verificationPage, `/zh/editor/${prompt.id}`, "#editor-model");
    await expect(verificationPage.locator("#editor-model")).toContainText(prompt.modelText);
    await expect(verificationPage.locator("#editor-status")).toContainText(prompt.statusText);

    assertVerificationConsoleErrors();
    await verificationPage.close();

    await resetAdminToDefault(page);
    adminStateDirty = false;
    assertNoConsoleErrors();
  });

  test("member denial stays intact in production mode", async ({ page }) => {
    const assertNoConsoleErrors = attachConsoleErrors(page);
    await setAuthRole(page, "member");

    await openRoute(page, "/zh/admin", "h1");
    await expect(page.locator("#admin-workspace-save")).toHaveCount(0);
    await expect(page.locator("#admin-agent-save")).toHaveCount(0);
    await expect(page.locator("#admin-export-copy")).toHaveCount(0);
    await expect(page.locator("#admin-export-download")).toHaveCount(0);
    await expect(page.locator("#admin-import-text")).toHaveCount(0);

    assertNoConsoleErrors();
  });
});
