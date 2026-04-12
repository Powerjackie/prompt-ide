import { readFile } from "node:fs/promises";

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

async function assertBodyContains(page: Page, pattern: RegExp, message: string) {
  const bodyText = await page.locator("body").innerText();
  expect(bodyText, `${message}\n\n${bodyText.slice(0, 1600)}`).toMatch(pattern);
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

async function assertHomeFeatureCardsReadable(page: Page, label: string) {
  const cards = page.locator(".gs-home-feature-card");
  expect(await cards.count(), `${label} expected at least 3 feature cards.`).toBeGreaterThanOrEqual(3);

  const unreadable = await page.evaluate(async () => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".gs-home-feature-card"));

    for (const element of cards) {
      element.scrollIntoView({ behavior: "instant", block: "center" });
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }

    return cards
      .map((element) => {
        element.scrollIntoView({ behavior: "instant", block: "center" });

        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const link = element.querySelector<HTMLAnchorElement>("a[href]");
        const linkRect = link?.getBoundingClientRect();

        return {
          text: element.textContent?.trim().slice(0, 40),
          opacity: style.opacity,
          visibility: style.visibility,
          inViewport:
            rect.bottom > 0 &&
            rect.top < window.innerHeight &&
            rect.right > 0 &&
            rect.left < window.innerWidth,
          linkInViewport:
            !!linkRect &&
            linkRect.bottom > 0 &&
            linkRect.top < window.innerHeight &&
            linkRect.right > 0 &&
            linkRect.left < window.innerWidth,
        };
      })
      .filter(
        (entry) =>
          entry.inViewport &&
          (entry.visibility === "hidden" || entry.opacity !== "1" || !entry.linkInViewport),
      );
  });

  expect(unreadable, `${label} has unreadable feature cards.`).toEqual([]);
}

async function assertDocsSurfaceClean(page: Page) {
  const badLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .map((element) => element.getAttribute("href"))
      .filter(
        (href): href is string =>
          Boolean(href) &&
          /(\/settings|\/skills|\/collections|\/archive|\/favorites|\/inbox|\/tags|\/docs\/.+)/.test(
            href,
          ),
      ),
  );

  expect(badLinks, `Docs page linked to removed routes: ${badLinks.join(", ")}`).toEqual([]);
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

test.describe("retained-surface smoke", () => {
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
      throw new Error("Failed to capture existing editor model/status text for smoke baseline.");
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
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await resetAdminToDefault(page);
    adminStateDirty = false;
  });

  test("admin desktop retained routes", async ({ page }) => {
    const assertNoConsoleErrors = attachConsoleErrors(page);
    await setAuthRole(page, "admin");

    await openRoute(page, "/zh", ".home-hero__title");
    await assertBodyContains(page, /PROMPT OPERATIONS/i, "zh home is missing the hero title.");
    await assertHomeFeatureCardsReadable(page, "zh home");

    await openRoute(page, "/en", ".home-hero__title");
    await assertBodyContains(page, /PROMPT OPERATIONS/i, "en home is missing the hero title.");
    await assertHomeFeatureCardsReadable(page, "en home");

    await openRoute(page, "/zh/playground", ".playground-stage-textarea");
    await page.locator(".playground-template").first().click();
    await expect(page.locator(".playground-stage-textarea")).toHaveValue(/\S+/);
    await expect(page.getByRole("button", { name: /Analyze|\u5206\u6790/i }).first()).toBeEnabled();

    await openRoute(page, "/zh/prompts", "body");
    expect(await page.locator(".prompt-library-item").count()).toBeGreaterThan(0);

    await openRoute(page, `/zh/prompts/${prompt.id}`, "h1");
    for (const id of ["versions", "benchmark", "agent"]) {
      await expect(page.locator(`#${id}`), `Prompt detail page missed section ${id}.`).toHaveCount(1);
    }

    await openRoute(page, `/zh/editor/${prompt.id}`, "textarea");
    expect(await page.locator("[role='tab']").count()).toBeGreaterThanOrEqual(3);

    await openRoute(page, "/zh/modules", "h1");
    await openRoute(page, "/zh/docs", "h1");
    await assertDocsSurfaceClean(page);

    await openRoute(page, "/en/docs", "h1");
    await assertDocsSurfaceClean(page);

    await openRoute(page, "/zh/admin", "#admin-default-model");
    await openRoute(page, "/en/admin", "h1");
    await assertBodyContains(page, /(Admin Console|Access Denied)/i, "English admin route did not render.");

    assertNoConsoleErrors();
  });

  test("admin reversible save/reset cleanup and settings hydration", async ({ page }, testInfo) => {
    const assertNoConsoleErrors = attachConsoleErrors(page);
    await setAuthRole(page, "admin");

    await openRoute(page, "/zh/admin", "#admin-default-model");
    adminStateDirty = true;
    await expect(page.locator("#admin-diagnostics")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.locator("#admin-export-download").click();
    const download = await downloadPromise;
    const exportPath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(exportPath);
    const exportedPayload = JSON.parse(await readFile(exportPath, "utf8"));

    expect(exportedPayload).toMatchObject({
      theme: expect.any(String),
      defaultView: expect.any(String),
      defaultModel: expect.any(String),
      defaultStatus: expect.any(String),
      agent: {
        enabled: expect.any(Boolean),
        autoAnalyze: expect.any(Boolean),
        analyzeOnPaste: expect.any(Boolean),
        enableNormalization: expect.any(Boolean),
        enableModuleExtraction: expect.any(Boolean),
        provider: expect.any(String),
        analysisDepth: expect.any(String),
        riskThreshold: expect.any(String),
        confidenceThreshold: expect.any(Number),
        similarityThreshold: expect.any(Number),
      },
    });

    await page.locator("#admin-import-text").fill("{");
    await page.locator("#admin-import-validate").click();
    await expect(page.locator("#admin-import-error")).toContainText(/invalid/i);

    await page.locator("#admin-import-text").fill(
      JSON.stringify(
        {
          ...exportedPayload,
          defaultModel: "unsupported-model",
        },
        null,
        2,
      ),
    );
    await page.locator("#admin-import-validate").click();
    await expect(page.locator("#admin-import-error")).toContainText(/defaultModel/i);

    await page.locator("#admin-import-text").fill(
      JSON.stringify(
        {
          ...exportedPayload,
          agent: {
            ...exportedPayload.agent,
            confidenceThreshold: 1.4,
          },
        },
        null,
        2,
      ),
    );
    await page.locator("#admin-import-validate").click();
    await expect(page.locator("#admin-import-error")).toContainText(/confidenceThreshold/i);

    const importPayload = {
      ...exportedPayload,
      theme: "dark",
      defaultView: "list",
      defaultModel: "deepseek",
      defaultStatus: "production",
      agent: {
        ...exportedPayload.agent,
        enabled: false,
        confidenceThreshold: 0.52,
      },
    };

    await page.locator("#admin-import-text").fill(JSON.stringify(importPayload, null, 2));
    await page.locator("#admin-import-validate").click();
    await expect(page.locator("#admin-import-error")).toHaveCount(0);
    await page.locator("#admin-import-trigger").click();
    await page.locator("#admin-import-confirm").click();

    await expect
      .poll(async () => page.evaluate(() => document.documentElement.classList.contains("dark")))
      .toBe(true);

    await expect(page.locator("#admin-default-model")).toContainText(/DeepSeek/i);
    await expect(page.locator("#admin-default-view")).toContainText(/List|\u5217\u8868/i);
    await expect(page.locator("#admin-default-status")).toContainText(/Production|\u751f\u4ea7/i);
    await expect(page.locator("#agent-confidence")).toHaveValue("0.52");
    await expect(page.locator("#admin-diagnostics")).toContainText(/DeepSeek/i);
    await expect(page.locator("#admin-diagnostics")).toContainText(/List|\u5217\u8868/i);
    await expect(page.locator("#admin-diagnostics")).toContainText(
      /Enabled|Disabled|\u5df2\u542f\u7528|\u5df2\u7981\u7528/i,
    );

    const verificationPage = await page.context().newPage();
    const assertVerificationConsoleErrors = attachConsoleErrors(verificationPage);

    await openRoute(verificationPage, "/zh/admin", "#admin-default-model");
    await expect(verificationPage.locator("#admin-diagnostics")).toBeVisible();
    await expect(verificationPage.locator("#admin-default-model")).toContainText(/DeepSeek/i);
    await expect(verificationPage.locator("#admin-default-view")).toContainText(/List|\u5217\u8868/i);
    await expect(verificationPage.locator("#admin-default-status")).toContainText(/Production|\u751f\u4ea7/i);
    await expect(verificationPage.locator("#agent-confidence")).toHaveValue("0.52");

    await openRoute(verificationPage, "/zh/prompts", "body");
    await expect(verificationPage.locator(".prompt-draggable-card")).toHaveCount(0);
    expect(await verificationPage.locator(".prompt-library-item").count()).toBeGreaterThan(0);

    await verificationPage.setViewportSize({ width: 390, height: 844 });
    await openRoute(verificationPage, "/zh/prompts", "body");
    await assertNoHorizontalOverflow(verificationPage, "Mobile prompts");
    expect(await verificationPage.locator(".prompt-draggable-card").count()).toBeGreaterThan(0);

    await verificationPage.setViewportSize({ width: 1440, height: 1100 });
    await openRoute(verificationPage, "/zh/editor", "#editor-model");
    await expect(verificationPage.locator("#editor-model")).toContainText(/DeepSeek/i);
    await expect(verificationPage.locator("#editor-status")).toContainText(/Production|\u751f\u4ea7/i);

    await openRoute(verificationPage, `/zh/editor/${prompt.id}`, "#editor-model");
    await expect(verificationPage.locator("#editor-model")).toContainText(prompt.modelText);
    await expect(verificationPage.locator("#editor-status")).toContainText(prompt.statusText);

    await openRoute(verificationPage, "/zh/playground", ".playground-stage-textarea");
    await verificationPage.locator(".playground-template").first().click();
    await expect(
      verificationPage.getByRole("button", { name: /Analyze|\u5206\u6790/i }).first(),
    ).toBeDisabled();
    await assertBodyContains(
      verificationPage,
      /Agent features are disabled by admin settings\.|Agent \u529f\u80fd\u5df2\u7531\u7ba1\u7406\u5458\u7981\u7528/i,
      "Playground did not render the agent-disabled message.",
    );

    await openRoute(verificationPage, `/zh/editor/${prompt.id}`, "[role='tab']");
    await verificationPage.getByRole("tab", { name: /Agent/i }).first().click();
    await assertBodyContains(
      verificationPage,
      /Agent features are disabled by admin settings\.|Agent \u529f\u80fd\u5df2\u7531\u7ba1\u7406\u5458\u7981\u7528/i,
      "Editor agent surface did not render the disabled message.",
    );
    expect(await verificationPage.locator("button:disabled").count()).toBeGreaterThan(0);
    assertVerificationConsoleErrors();
    await verificationPage.close();

    await resetAdminToDefault(page);
    adminStateDirty = false;
    assertNoConsoleErrors();
  });

  test("command palette docs/admin discoverability", async ({ page }) => {
    const assertNoConsoleErrors = attachConsoleErrors(page);
    await setAuthRole(page, "admin");

    await openRoute(page, "/zh", ".home-hero__title");
    await page.getByRole("button", { name: /Search prompts|\u641c\u7d22\u63d0\u793a\u8bcd/i }).click();
    await page.locator("[data-slot='dialog-content']").waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("[data-slot='command-item']").filter({ hasText: /Docs|\u6587\u6863/i }).first().click();
    await page.waitForURL((url) => /\/docs$/.test(url.pathname));

    await openRoute(page, "/zh/docs", "h1");
    await page.getByRole("button", { name: /Search prompts|\u641c\u7d22\u63d0\u793a\u8bcd/i }).click();
    await page.locator("[data-slot='dialog-content']").waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("[data-slot='command-item']").filter({ hasText: /Admin|\u7ba1\u7406/i }).first().click();
    await page.waitForURL((url) => /\/admin$/.test(url.pathname));

    await openRoute(page, "/zh/admin", "h1");
    assertNoConsoleErrors();
  });

  test("member admin denial", async ({ page }) => {
    const assertNoConsoleErrors = attachConsoleErrors(page);
    await setAuthRole(page, "member");

    await openRoute(page, "/zh/admin", "h1");
    await expect(page.locator("#admin-workspace-save")).toHaveCount(0);
    await expect(page.locator("#admin-agent-save")).toHaveCount(0);
    await expect(page.locator("#admin-export-copy")).toHaveCount(0);
    await expect(page.locator("#admin-export-download")).toHaveCount(0);
    await expect(page.locator("#admin-import-text")).toHaveCount(0);
    expect(await page.locator("a[href$='/docs']").count()).toBeGreaterThan(0);

    assertNoConsoleErrors();
  });

  test("mobile retained routes", async ({ page }) => {
    const assertNoConsoleErrors = attachConsoleErrors(page);
    await setAuthRole(page, "admin");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });

    await openRoute(page, "/zh", ".home-hero__title");
    await assertNoHorizontalOverflow(page, "Mobile home");
    await assertHomeFeatureCardsReadable(page, "Mobile home");

    await openRoute(page, "/zh/docs", "h1");
    await assertNoHorizontalOverflow(page, "Mobile docs");

    await openRoute(page, "/zh/admin", "h1");
    await assertNoHorizontalOverflow(page, "Mobile admin");

    assertNoConsoleErrors();
  });

  test("reduced-motion surfaces remain visible", async ({ page }) => {
    const assertNoConsoleErrors = attachConsoleErrors(page);
    await setAuthRole(page, "admin");
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ reducedMotion: "reduce" });

    await openRoute(page, "/zh", ".home-hero__title");
    await assertHomeFeatureCardsReadable(page, "Reduced-motion home");

    await openRoute(page, "/zh/docs", "h1");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toHaveCSS("opacity", "1");

    await openRoute(page, "/zh/admin", "h1");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toHaveCSS("opacity", "1");

    assertNoConsoleErrors();
  });
});
