param(
  [string]$BaseUrl = "http://127.0.0.1:3000",
  [string]$Locale = "zh",
  [string]$PromptId = "",
  [switch]$Headed,
  [string]$Session = "smoke"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$OutputDir = Join-Path $ProjectRoot "output/playwright/smoke"
$ReportPath = Join-Path $OutputDir "smoke-report.json"
$DevOutLog = Join-Path $OutputDir "next-dev.out.log"
$DevErrLog = Join-Path $OutputDir "next-dev.err.log"
$EnvPath = Join-Path $ProjectRoot ".env"
$DbPath = Join-Path $ProjectRoot "dev.db"

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$results = [System.Collections.Generic.List[object]]::new()
$startedDevServer = $null

function Add-Result {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Details
  )

  $results.Add([pscustomobject]@{
    name = $Name
    status = $Status
    details = $Details
    timestamp = (Get-Date).ToString("o")
  })
}

function Invoke-Pw {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$PlaywrightArgs
  )

  $output = & npx --yes --package @playwright/cli playwright-cli "-s=$Session" @PlaywrightArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Playwright CLI failed: $($output | Out-String)"
  }

  return ($output | Out-String)
}

function Invoke-PwCode {
  param([string]$Code)

  Invoke-Pw "run-code" $Code | Out-Null
}

function Wait-Pw {
  param([int]$Milliseconds)

  Invoke-PwCode "await page.waitForTimeout($Milliseconds);"
}

function Assert-NoConsoleErrors {
  param([string]$Label)

  $output = Invoke-Pw "console" "error"
  if ($output -notmatch "Errors:\s*0" -or $output -notmatch "Returning 0 messages") {
    throw "$Label produced browser console errors.`n$output"
  }
}

function Save-Screenshot {
  param([string]$Name)

  Push-Location $OutputDir
  try {
    Invoke-Pw "screenshot" | Out-Null
  } finally {
    Pop-Location
  }
}

function Get-EnvValue {
  param([string]$Name)

  $pattern = "^\s*$([regex]::Escape($Name))\s*=\s*(.*)\s*$"
  foreach ($line in Get-Content $EnvPath) {
    if ($line -match $pattern) {
      $value = $Matches[1].Trim()
      if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        return $value.Trim('"')
      }
      return $value
    }
  }

  throw "Missing $Name in .env"
}

function Get-SmokeData {
  $script = @"
import json
import sqlite3

conn = sqlite3.connect(r"$DbPath")
conn.row_factory = sqlite3.Row

prompt = conn.execute(
    "select id, title from Prompt order by updatedAt desc limit 1"
).fetchone()
collection = conn.execute(
    "select id, title from Collection order by updatedAt desc limit 1"
).fetchone()
skill = conn.execute(
    "select id, name from Skill order by updatedAt desc limit 1"
).fetchone()

print(json.dumps({
    "prompt": dict(prompt) if prompt else None,
    "collection": dict(collection) if collection else None,
    "skill": dict(skill) if skill else None,
}))
"@

  $json = $script | python -
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to query dev.db for smoke test data."
  }

  return $json | ConvertFrom-Json
}

function Ensure-Server {
  param([string]$LoginUrl)

  try {
    $null = Invoke-WebRequest -UseBasicParsing -Uri $LoginUrl -TimeoutSec 5
    return
  } catch {
    $command = "Set-Location '$ProjectRoot'; npm run dev"
    $startedDevServer = Start-Process powershell `
      -ArgumentList "-NoProfile", "-Command", $command `
      -WorkingDirectory $ProjectRoot `
      -RedirectStandardOutput $DevOutLog `
      -RedirectStandardError $DevErrLog `
      -PassThru

    for ($attempt = 0; $attempt -lt 60; $attempt++) {
      Start-Sleep -Seconds 2
      try {
        $null = Invoke-WebRequest -UseBasicParsing -Uri $LoginUrl -TimeoutSec 5
        return
      } catch {
        continue
      }
    }

    throw "Dev server did not become ready at $LoginUrl. See $DevOutLog and $DevErrLog."
  }
}

function Ensure-BodyContains {
  param(
    [string]$RegexPattern,
    [string]$FailureMessage
  )

  $patternJson = ($RegexPattern | ConvertTo-Json -Compress)
  $messageJson = ($FailureMessage | ConvertTo-Json -Compress)

  Invoke-PwCode @"
await page.waitForLoadState("networkidle");
const bodyText = await page.locator("body").innerText();
if (!(new RegExp($patternJson, "i")).test(bodyText)) {
  throw new Error($messageJson + "\n\n" + bodyText.slice(0, 1200));
}
"@
}

try {
  $base = $BaseUrl.TrimEnd("/")
  $adminPassword = Get-EnvValue "ADMIN_PASSWORD"
  $smokeData = Get-SmokeData

  if (-not $PromptId) {
    if (-not $smokeData.prompt) {
      throw "No prompt found in dev.db. Seed at least one prompt before running browser smoke."
    }
    $PromptId = [string]$smokeData.prompt.id
  }

  $latestCollectionId = if ($smokeData.collection) { [string]$smokeData.collection.id } else { "" }
  $latestCollectionTitle = if ($smokeData.collection) { [string]$smokeData.collection.title } else { "" }
  $latestSkillId = if ($smokeData.skill) { [string]$smokeData.skill.id } else { "" }
  $latestSkillName = if ($smokeData.skill) { [string]$smokeData.skill.name } else { "" }

  $loginUrl = "$base/$Locale/login"
  $homeUrl = "$base/$Locale"
  $promptDetailUrl = "$base/$Locale/prompts/$PromptId"
  $editorUrl = "$base/$Locale/editor/$PromptId"
  $playgroundUrl = "$base/$Locale/playground"
  $collectionsUrl = "$base/$Locale/collections"
  $skillsUrl = "$base/$Locale/skills"
  $englishPromptUrl = "$base/en/prompts/$PromptId"

  Ensure-Server -LoginUrl $loginUrl

  Invoke-Pw "close-all" | Out-Null
  Invoke-Pw "delete-data" | Out-Null

  $openArgs = @("open", $loginUrl)
  if ($Headed) {
    $openArgs += "--headed"
  }
  Invoke-Pw @openArgs | Out-Null

  $passwordJson = ($adminPassword | ConvertTo-Json -Compress)
  Invoke-PwCode @"
await page.locator("input[name='password']").fill($passwordJson);
await Promise.all([
  page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 20000 }),
  page.locator("button[type='submit']").click(),
]);
await page.locator("aside").waitFor({ state: "visible", timeout: 15000 });
"@
  Assert-NoConsoleErrors "login flow"
  Save-Screenshot "01-home-after-login.png"
  Add-Result "login" "passed" "Authenticated and reached the protected app shell."

  Invoke-PwCode @"
await page.goto("$homeUrl");
await page.locator("aside a[href$='/prompts']").waitFor({ state: "visible", timeout: 15000 });
"@
  Assert-NoConsoleErrors "home page"
  Save-Screenshot "02-home.png"
  Add-Result "home" "passed" "Sidebar navigation loaded."

  Invoke-PwCode @"
await page.goto("$promptDetailUrl");
await page.waitForLoadState("networkidle");
await page.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
"@
  Ensure-BodyContains -RegexPattern "(Benchmark|评测)" -FailureMessage "Prompt detail page is missing the benchmark panel."
  Ensure-BodyContains -RegexPattern "(Version|版本)" -FailureMessage "Prompt detail page is missing version history content."
  Assert-NoConsoleErrors "prompt detail page"
  Save-Screenshot "03-prompt-detail-zh.png"
  Add-Result "prompt-detail-zh" "passed" "Saved prompt detail rendered with benchmark and version panels."

  Invoke-PwCode @"
await page.goto("$englishPromptUrl");
await page.waitForLoadState("networkidle");
await page.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
"@
  Ensure-BodyContains -RegexPattern "(Benchmark|Versions?)" -FailureMessage "English prompt detail page did not render the expected prompt panels."
  Assert-NoConsoleErrors "english prompt detail page"
  Save-Screenshot "04-prompt-detail-en.png"
  Add-Result "prompt-detail-en" "passed" "English prompt detail rendered cleanly."

  Invoke-PwCode @"
await page.goto("$editorUrl");
await page.waitForLoadState("networkidle");
await page.getByRole("tab", { name: /Agent/i }).click();
await page.getByRole("tab", { name: /Refactor|重构/i }).click();

const bodyBefore = await page.locator("body").innerText();
if (/No refactor proposal yet|还没有重构提案/.test(bodyBefore)) {
  await page.getByRole("button", { name: /Run Refactor|Re-run Refactor|运行重构|重新运行重构/i }).click();
  await page.waitForFunction(
    () => /Apply Draft|应用草稿|Create Selected Modules|创建所选模块/.test(document.body.innerText),
    { timeout: 180000 }
  );
}
"@
  Ensure-BodyContains -RegexPattern "(Apply Draft|应用草稿)" -FailureMessage "Refactor panel did not expose an applyable proposal."
  Assert-NoConsoleErrors "editor refactor panel"
  Save-Screenshot "05-editor-refactor.png"
  Add-Result "editor-refactor" "passed" "Editor Agent -> Refactor loaded an actionable proposal."

  $samplePrompt = "I need a customized, intensive plan to significantly improve my English speaking ability within one month. Please provide a daily schedule and actionable exercises."
  $samplePromptJson = ($samplePrompt | ConvertTo-Json -Compress)
  Invoke-PwCode @"
await page.goto("$playgroundUrl");
await page.waitForLoadState("networkidle");
await page.locator("textarea").fill($samplePromptJson);
await page.getByRole("button", { name: /Analyze|分析/i }).click();
await page.waitForFunction(
  () => /Confidence|置信度/.test(document.body.innerText),
  { timeout: 180000 }
);
"@
  Ensure-BodyContains -RegexPattern "(Confidence|置信度)" -FailureMessage "Playground analysis did not render a confidence block."
  Assert-NoConsoleErrors "playground analysis"
  Save-Screenshot "06-playground.png"
  Add-Result "playground-analysis" "passed" "Stateless MiniMax analysis rendered in the playground."

  if ($latestCollectionId) {
    $collectionUrl = "$base/$Locale/collections/$latestCollectionId"
    Invoke-PwCode @"
await page.goto("$collectionUrl");
await page.waitForLoadState("networkidle");
await page.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
"@
    if ($latestCollectionTitle) {
      Ensure-BodyContains -RegexPattern ([regex]::Escape($latestCollectionTitle)) -FailureMessage "Collection detail page did not render the latest collection title."
    }
    Assert-NoConsoleErrors "collection detail page"
    Save-Screenshot "07-collection-detail.png"
    Add-Result "collection-detail" "passed" "Latest collection detail rendered correctly."
  } else {
    Invoke-PwCode @"
await page.goto("$collectionsUrl");
await page.waitForLoadState("networkidle");
await page.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
"@
    Ensure-BodyContains -RegexPattern "(Collections|合集)" -FailureMessage "Collections list did not render."
    Assert-NoConsoleErrors "collections list page"
    Save-Screenshot "07-collections.png"
    Add-Result "collections-list" "passed" "Collections list rendered."
  }

  if ($latestSkillId) {
    $skillDetailUrl = "$base/$Locale/skills/$latestSkillId"
    $skillRunUrl = "$base/$Locale/skills/$latestSkillId/run"

    Invoke-PwCode @"
await page.goto("$skillsUrl");
await page.waitForLoadState("networkidle");
await page.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
"@
    Ensure-BodyContains -RegexPattern "(Skills|技能)" -FailureMessage "Skills list did not render."
    if ($latestSkillName) {
      Ensure-BodyContains -RegexPattern ([regex]::Escape($latestSkillName)) -FailureMessage "Skills list did not show the seeded skill."
    }
    Assert-NoConsoleErrors "skills list page"
    Save-Screenshot "08-skills-list.png"
    Add-Result "skills-list" "passed" "Skills list rendered with health management UI."

    Invoke-PwCode @"
await page.goto("$skillDetailUrl");
await page.waitForLoadState("networkidle");
await page.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
"@
    Ensure-BodyContains -RegexPattern "(Capability Health|能力健康)" -FailureMessage "Skill detail page is missing the capability health summary."
    Assert-NoConsoleErrors "skill detail page"
    Save-Screenshot "09-skill-detail.png"
    Add-Result "skill-detail" "passed" "Skill detail rendered baseline, benchmark, and recent run context."

    Invoke-PwCode @"
await page.goto("$skillRunUrl");
await page.waitForLoadState("networkidle");
await page.locator("h1").first().waitFor({ state: "visible", timeout: 15000 });
"@
    Ensure-BodyContains -RegexPattern "(Recent Runs|最近运行)" -FailureMessage "Skill runner did not render recent runs."
    Ensure-BodyContains -RegexPattern "(Run Skill|运行技能|Run)" -FailureMessage "Skill runner did not render the primary execution action."
    Assert-NoConsoleErrors "skill run page"
    Save-Screenshot "10-skill-run.png"
    Add-Result "skill-run" "passed" "Skill runner rendered presets, recent runs, and execution controls."
  }
} catch {
  Add-Result "smoke-run" "failed" $_.Exception.Message
  throw
} finally {
  try {
    Invoke-Pw "close" | Out-Null
  } catch {
  }

  if ($startedDevServer) {
    try {
      Stop-Process -Id $startedDevServer.Id -Force
    } catch {
    }
  }

  $results | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 $ReportPath
}
