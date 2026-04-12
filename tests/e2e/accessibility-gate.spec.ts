import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { setAuthRole } from "./helpers/auth";

type AxeScanOptions = {
  include?: string[];
  exclude?: string[];
  disableRules?: string[];
};

type RouteCase = {
  route: string;
  label: string;
  waitSelector: string;
  prepare?: (page: Page) => Promise<void>;
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

async function openRoute(page: Page, route: string, waitSelector: string, timeout = 20_000) {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.locator(waitSelector).first().waitFor({ state: "visible", timeout });
}

async function assertMainLandmark(page: Page, label: string) {
  const mainCount = await page.locator("main").count();
  expect(mainCount, `${label} should expose a main landmark.`).toBeGreaterThanOrEqual(1);
}

function serializeViolations(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => node.target.join(" ")).slice(0, 5),
  }));
}

async function checkA11y(page: Page, label: string, options: AxeScanOptions = {}) {
  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);

  for (const selector of options.include ?? []) {
    builder = builder.include(selector);
  }

  for (const selector of options.exclude ?? []) {
    builder = builder.exclude(selector);
  }

  if (options.disableRules?.length) {
    builder = builder.disableRules(options.disableRules);
  }

  const { violations } = await builder.analyze();
  expect(serializeViolations(violations), `${label} contains accessibility violations.`).toEqual([]);
}

const adminRoutes: RouteCase[] = [
  { route: "/zh", label: "zh home", waitSelector: ".home-hero__title" },
  { route: "/zh/docs", label: "zh docs", waitSelector: "h1" },
  { route: "/en/docs", label: "en docs", waitSelector: "h1" },
  { route: "/zh/admin", label: "zh admin", waitSelector: "#admin-default-model" },
  { route: "/zh/prompts", label: "zh prompts", waitSelector: ".prompt-library-item" },
  { route: "/zh/editor", label: "zh editor", waitSelector: "#editor-model" },
  {
    route: "/zh/playground",
    label: "zh playground",
    waitSelector: ".playground-stage-textarea",
    prepare: async (page) => {
      const template = page.locator(".playground-template").first();
      if (await template.count()) {
        await template.click();
      }
    },
  },
];

test.describe("accessibility gate", () => {
  test.beforeEach(async ({ page }) => {
    await setAuthRole(page, "admin");
    await page.setViewportSize({ width: 1440, height: 1100 });
    // Stabilize animation-heavy surfaces before running a11y scans.
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const routeCase of adminRoutes) {
    test(`${routeCase.label} passes automated a11y baseline`, async ({ page }) => {
      const assertNoConsoleErrors = attachConsoleErrors(page);

      await openRoute(page, routeCase.route, routeCase.waitSelector);
      if (routeCase.prepare) {
        await routeCase.prepare(page);
      }

      await assertMainLandmark(page, routeCase.label);
      await checkA11y(page, routeCase.label);
      assertNoConsoleErrors();
    });
  }

  test("command palette dialog passes automated a11y baseline", async ({ page }) => {
    const assertNoConsoleErrors = attachConsoleErrors(page);

    await openRoute(page, "/zh", ".home-hero__title");
    await page.getByRole("button", { name: /Search prompts|\u641c\u7d22\u63d0\u793a\u8bcd/i }).click();
    await page.locator("[data-slot='dialog-content']").first().waitFor({ state: "visible" });
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible();
    await expect(page.getByRole("listbox")).toBeVisible();

    await checkA11y(page, "command palette dialog", {
      include: ["[data-slot='dialog-content']"],
      // cmdk wraps grouped options in structural elements that can trigger aria-required-children
      // despite valid keyboard behavior and option semantics; keep this waiver scoped to this dialog.
      disableRules: ["aria-required-children"],
    });
    assertNoConsoleErrors();
  });

  test("member admin denial page passes automated a11y baseline", async ({ page }) => {
    const assertNoConsoleErrors = attachConsoleErrors(page);
    await setAuthRole(page, "member");

    await openRoute(page, "/zh/admin", "h1");
    await assertMainLandmark(page, "member admin denial");
    await checkA11y(page, "member admin denial");
    assertNoConsoleErrors();
  });
});
