const lhciPort = process.env.LHCI_PORT ?? "3000";
const lhciBaseUrl = process.env.LHCI_BASE_URL ?? `http://127.0.0.1:${lhciPort}`;
const lhciChromePath = process.env.LHCI_CHROME_PATH;

const keyRoutes = [
  `${lhciBaseUrl}/`,
  `${lhciBaseUrl}/zh/docs`,
  `${lhciBaseUrl}/zh/admin`,
  `${lhciBaseUrl}/zh/playground`,
  `${lhciBaseUrl}/zh/prompts`,
];

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      url: keyRoutes,
      startServerCommand: `npm run start -- --hostname 127.0.0.1 --port ${lhciPort}`,
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 180000,
      settings: {
        preset: "desktop",
        throttlingMethod: "simulate",
        ...(lhciChromePath ? { chromePath: lhciChromePath } : {}),
        // GitHub Actions runners (Ubuntu 23.10+) disable unprivileged user
        // namespaces via AppArmor, so Chromium fails with "No usable sandbox".
        // --no-sandbox is the documented workaround for CI environments.
        chromeFlags: "--no-sandbox --headless --disable-gpu --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.35 }],
      },
    },
  },
};
