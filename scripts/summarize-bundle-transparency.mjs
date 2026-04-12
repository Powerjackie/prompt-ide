#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const nextRoot = path.join(repoRoot, ".next");
const analyzeRoot = path.join(nextRoot, "diagnostics", "analyze");
const analyzeDataRoot = path.join(analyzeRoot, "data");

const routesFile = path.join(analyzeDataRoot, "routes.json");
const serverReferenceManifestFile = path.join(nextRoot, "server", "server-reference-manifest.json");

const outputDir = path.join(repoRoot, "output", "perf");
const outputJsonFile = path.join(outputDir, "bundle-transparency-summary.json");
const reportFile = path.join(repoRoot, "docs", "ops", "bundle-transparency-baseline.md");

const retainedAnalyzeRoutes = [
  "/[locale]",
  "/[locale]/docs",
  "/[locale]/admin",
  "/[locale]/playground",
  "/[locale]/prompts",
  "/[locale]/editor",
  "/[locale]/modules",
];

function ensureFileExists(filePath, guidance) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${guidance}\nMissing: ${filePath}`);
  }
}

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function formatMiB(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}

function safeRelPath(targetPath) {
  return path.relative(repoRoot, targetPath).replace(/\\/g, "/");
}

function displayRoute(analyzeRoute) {
  if (analyzeRoute === "/[locale]") {
    return "/ (zh default route)";
  }
  return analyzeRoute.replace("/[locale]", "/zh");
}

function analyzeRouteToDataFile(route) {
  const segments = route.replace(/^\//, "").split("/");
  return path.join(analyzeDataRoot, ...segments, "analyze.data");
}

function analyzeRouteToNftFile(route) {
  const segments = route.replace(/^\//, "").split("/");
  return path.join(nextRoot, "server", "app", ...segments, "page.js.nft.json");
}

function analyzeRouteToServerManifestWorker(route) {
  if (route === "/[locale]") {
    return "app/[locale]/page";
  }
  return `app${route}/page`;
}

function extractAnalyzerChunkRefs(routeDataText) {
  const matches =
    routeDataText.match(/(?:\[client-fs\])?\/_next\/static\/chunks\/[^"'`\]\s]+?\.(?:js|css)/g) ?? [];
  return Array.from(new Set(matches)).sort();
}

function packageFromAbsolutePath(absPath) {
  const marker = `${path.sep}node_modules${path.sep}`;
  const index = absPath.indexOf(marker);
  if (index === -1) {
    return null;
  }

  const tail = absPath.slice(index + marker.length).replace(/\\/g, "/");
  const segments = tail.split("/");
  if (segments[0].startsWith("@")) {
    return `${segments[0]}/${segments[1] ?? ""}`;
  }
  return segments[0];
}

function readNftStats(nftFilePath) {
  if (!fs.existsSync(nftFilePath)) {
    return {
      exists: false,
      traceFileCount: 0,
      traceTotalBytes: 0,
      topPackages: [],
    };
  }

  const nft = JSON.parse(fs.readFileSync(nftFilePath, "utf8"));
  const files = Array.isArray(nft.files) ? nft.files : [];
  const resolved = new Set();
  const packageBytes = new Map();
  let totalBytes = 0;

  for (const relFile of files) {
    const absFile = path.resolve(path.dirname(nftFilePath), relFile);
    if (resolved.has(absFile)) {
      continue;
    }
    resolved.add(absFile);

    if (!fs.existsSync(absFile)) {
      continue;
    }

    const size = fs.statSync(absFile).size;
    totalBytes += size;

    const pkg = packageFromAbsolutePath(absFile);
    if (!pkg) {
      continue;
    }
    packageBytes.set(pkg, (packageBytes.get(pkg) ?? 0) + size);
  }

  const topPackages = Array.from(packageBytes.entries())
    .map(([name, sizeBytes]) => ({ name, sizeBytes }))
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 6);

  return {
    exists: true,
    traceFileCount: resolved.size,
    traceTotalBytes: totalBytes,
    topPackages,
  };
}

function readServerActionChains() {
  if (!fs.existsSync(serverReferenceManifestFile)) {
    return new Map();
  }

  const manifest = JSON.parse(fs.readFileSync(serverReferenceManifestFile, "utf8"));
  const actionMap = new Map();
  const nodes = manifest.node ?? {};

  for (const nodeEntry of Object.values(nodes)) {
    const workers = nodeEntry?.workers ?? {};
    for (const [workerRoute, workerDef] of Object.entries(workers)) {
      const filename = workerDef?.filename;
      if (!filename || typeof filename !== "string") {
        continue;
      }

      const current = actionMap.get(workerRoute) ?? new Set();
      current.add(filename);
      actionMap.set(workerRoute, current);
    }
  }

  const normalized = new Map();
  for (const [workerRoute, modules] of actionMap.entries()) {
    normalized.set(workerRoute, Array.from(modules).sort());
  }
  return normalized;
}

function summarizeSharedPackages(routeSummaries) {
  const packageBytes = new Map();
  const seenFiles = new Set();

  for (const route of routeSummaries) {
    if (!route.nftExists) {
      continue;
    }
    const nftFilePath = analyzeRouteToNftFile(route.analyzeRoute);
    const nft = JSON.parse(fs.readFileSync(nftFilePath, "utf8"));
    const files = Array.isArray(nft.files) ? nft.files : [];

    for (const relFile of files) {
      const absFile = path.resolve(path.dirname(nftFilePath), relFile);
      if (seenFiles.has(absFile) || !fs.existsSync(absFile)) {
        continue;
      }
      seenFiles.add(absFile);

      const pkg = packageFromAbsolutePath(absFile);
      if (!pkg) {
        continue;
      }

      const size = fs.statSync(absFile).size;
      packageBytes.set(pkg, (packageBytes.get(pkg) ?? 0) + size);
    }
  }

  return Array.from(packageBytes.entries())
    .map(([name, sizeBytes]) => ({ name, sizeBytes }))
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 12);
}

function generateReport(summary) {
  const routeRows = summary.routes
    .map((route) => {
      const topPkg = route.topPackages[0];
      const topPkgLabel = topPkg ? `${topPkg.name} (${formatKiB(topPkg.sizeBytes)})` : "n/a";
      return `| ${route.displayRoute} | ${route.analyzerPayloadBytes.toLocaleString()} B | ${route.analyzerChunkCount} | ${route.nftTraceFileCount} | ${formatMiB(route.nftTraceBytes)} | ${topPkgLabel} |`;
    })
    .join("\n");

  const sharedPkgRows =
    summary.sharedTopPackages.length > 0
      ? summary.sharedTopPackages
          .map((pkg) => `| ${pkg.name} | ${formatMiB(pkg.sizeBytes)} |`)
          .join("\n")
      : "| n/a | 0.00 MiB |";

  const actionRows =
    summary.routeActionChains.length > 0
      ? summary.routeActionChains
          .map((item) => `- \`${item.displayRoute}\`: ${item.modules.map((m) => `\`${m}\``).join(", ")}`)
          .join("\n")
      : "- No retained-route server actions found in server-reference-manifest.";

  const facts = summary.facts.map((line) => `- ${line}`).join("\n");
  const hypotheses = summary.hypotheses.map((line) => `- ${line}`).join("\n");
  const blockers = summary.blockers.length > 0 ? summary.blockers.map((line) => `- ${line}`).join("\n") : "- none";

  return `# Bundle Transparency Baseline (Initiative Q)

- Generated at: ${summary.generatedAt}
- Source command: \`npm run perf:bundle:transparency\`
- Analyzer source: \`${summary.analyzerSource}\`
- Summary JSON: \`${summary.outputJson}\`

## Retained Routes (Evidence Table)

| Route | Analyzer payload bytes | Analyzer chunk refs | NFT traced files | NFT traced bytes | Top traced package |
| --- | ---: | ---: | ---: | ---: | --- |
${routeRows}

## Shared Traced Packages (Retained Routes, unique files)

| Package | Traced size |
| --- | ---: |
${sharedPkgRows}

## Retained Route Server Action Chains

${actionRows}

## Facts

${facts}

## Hypotheses

${hypotheses}

## Blockers / Limitations

${blockers}

## Scope Guardrails

- This round adds bundle transparency only.
- It does not enable \`experimental.optimizePackageImports\`.
- It does not include route refactors, GSAP refactors, or database migration.
`;
}

function main() {
  ensureFileExists(routesFile, "Run `npm run perf:bundle:collect` before summarizing bundle transparency.");
  ensureFileExists(
    path.join(nextRoot, "server"),
    "Run `npm run build` before summarizing route trace sizes from .next/server.",
  );

  const routeSet = new Set(JSON.parse(fs.readFileSync(routesFile, "utf8")));
  const selectedAnalyzeRoutes = retainedAnalyzeRoutes.filter((route) => routeSet.has(route));
  if (selectedAnalyzeRoutes.length === 0) {
    throw new Error("No retained analyze routes were found in routes.json.");
  }

  const actionChains = readServerActionChains();
  const routeSummaries = [];

  for (const route of selectedAnalyzeRoutes) {
    const routeDataFile = analyzeRouteToDataFile(route);
    ensureFileExists(routeDataFile, `Route analyze output missing for ${route}. Re-run analyzer.`);

    const routeDataText = fs.readFileSync(routeDataFile, "utf8");
    const chunkRefs = extractAnalyzerChunkRefs(routeDataText);
    const analyzerPayloadBytes = fs.statSync(routeDataFile).size;

    const nftFile = analyzeRouteToNftFile(route);
    const nftStats = readNftStats(nftFile);

    const workerKey = analyzeRouteToServerManifestWorker(route);
    const modules = actionChains.get(workerKey) ?? [];

    routeSummaries.push({
      analyzeRoute: route,
      displayRoute: displayRoute(route),
      analyzerPayloadBytes,
      analyzerChunkCount: chunkRefs.length,
      analyzerChunkSamples: chunkRefs.slice(0, 8),
      nftExists: nftStats.exists,
      nftTraceFileCount: nftStats.traceFileCount,
      nftTraceBytes: nftStats.traceTotalBytes,
      topPackages: nftStats.topPackages,
      actionModules: modules,
    });
  }

  routeSummaries.sort((a, b) => b.nftTraceBytes - a.nftTraceBytes);

  const sharedTopPackages = summarizeSharedPackages(routeSummaries);
  const routeActionChains = routeSummaries
    .filter((route) => route.actionModules.length > 0)
    .map((route) => ({
      displayRoute: route.displayRoute,
      modules: route.actionModules,
    }));

  const topRoute = routeSummaries[0];
  const secondRoute = routeSummaries[1];
  const topPkg = sharedTopPackages[0];
  const blockers = [];

  if (routeSummaries.every((route) => route.nftTraceBytes === 0)) {
    blockers.push("All retained routes resolved to 0 NFT traced bytes. Build output is likely incomplete.");
  }

  const unresolvedChunkSizing = routeSummaries.some((route) => route.analyzerChunkCount > 0);
  if (unresolvedChunkSizing) {
    blockers.push(
      "Next experimental-analyze exposes [client-fs] virtual chunk references; they are retained as route evidence, but chunk byte sizing is derived from NFT traces instead of direct chunk-file mapping.",
    );
  }

  const facts = [
    `Bundle transparency entrypoint is now repeatable via npm scripts and produces both JSON + markdown evidence artifacts.`,
    `Top retained route by NFT traced bytes is ${topRoute.displayRoute} (${formatMiB(topRoute.nftTraceBytes)}).`,
    `Second retained route by NFT traced bytes is ${secondRoute.displayRoute} (${formatMiB(secondRoute.nftTraceBytes)}).`,
    `Shared traced package weight across retained routes is currently dominated by ${
      topPkg ? `${topPkg.name} (${formatMiB(topPkg.sizeBytes)})` : "no package data"
    }.`,
    `Retained route server action chains are now visible from server-reference-manifest for ${routeActionChains.length} retained routes.`,
  ];

  const topRouteActionSummary =
    topRoute.actionModules.length > 0
      ? topRoute.actionModules.map((module) => path.basename(module)).join(", ")
      : "no server actions";

  const hypotheses = [
    `Routes with higher NFT traced bytes (${topRoute.displayRoute}, ${secondRoute.displayRoute}) should be the first targets in a follow-up optimization initiative.`,
    `The current retained-route weight profile suggests shared runtime/data dependencies are a larger factor than one-off route UI code changes.`,
    `For ${topRoute.displayRoute}, server action chain breadth (${topRouteActionSummary}) may be a contributor, but this still requires module-level split validation before refactoring.`,
  ];

  const summary = {
    generatedAt: new Date().toISOString(),
    analyzerSource: ".next/diagnostics/analyze",
    outputJson: safeRelPath(outputJsonFile),
    routes: routeSummaries,
    sharedTopPackages,
    routeActionChains,
    facts,
    hypotheses,
    blockers,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });

  fs.writeFileSync(outputJsonFile, JSON.stringify(summary, null, 2));
  fs.writeFileSync(reportFile, generateReport(summary));

  console.log(`Bundle transparency summary written to ${safeRelPath(outputJsonFile)}`);
  console.log(`Bundle transparency report written to ${safeRelPath(reportFile)}`);
  console.log(
    `Top retained routes by trace bytes: ${routeSummaries
      .slice(0, 3)
      .map((route) => `${route.displayRoute} (${formatMiB(route.nftTraceBytes)})`)
      .join(" | ")}`,
  );
}

main();
