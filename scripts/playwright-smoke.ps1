param(
  [string]$BaseUrl = "",
  [switch]$Headed,
  [switch]$Prod
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$OutputDir = Join-Path $ProjectRoot "output/playwright/smoke"
$DevOutLog = Join-Path $OutputDir "next-dev.out.log"
$DevErrLog = Join-Path $OutputDir "next-dev.err.log"

$ProjectBaselinePort = 3000
$HostFallbackPort = 5173
$HadBaseUrlInput = [bool]$BaseUrl.Trim()
$HadEnvBaseUrlInput = [bool]($env:PLAYWRIGHT_BASE_URL -or $env:SMOKE_BASE_URL)
$ResolvedBaseUrl = if ($HadBaseUrlInput) {
  $BaseUrl.Trim().TrimEnd("/")
} elseif ($env:PLAYWRIGHT_BASE_URL) {
  $env:PLAYWRIGHT_BASE_URL.Trim().TrimEnd("/")
} elseif ($env:SMOKE_BASE_URL) {
  $env:SMOKE_BASE_URL.Trim().TrimEnd("/")
} else {
  "http://127.0.0.1:$ProjectBaselinePort"
}

$ResolvedUri = [uri]$ResolvedBaseUrl
$ResolvedPort = if ($ResolvedUri.IsDefaultPort) {
  if ($ResolvedUri.Scheme -eq "https") { 443 } else { 80 }
} else {
  $ResolvedUri.Port
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$startedDevServer = $null
$reusedDevServer = $false

function Require-Npx {
  if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw "npx is required to run the Playwright smoke workflow."
  }
}

function Test-PortBindable {
  param(
    [string]$HostName,
    [int]$Port
  )

  try {
    $addresses = [System.Net.Dns]::GetHostAddresses($HostName)
  } catch {
    return $false
  }

  foreach ($address in $addresses) {
    try {
      $listener = [System.Net.Sockets.TcpListener]::new($address, $Port)
      $listener.Start()
      $listener.Stop()
      return $true
    } catch {
      continue
    }
  }

  return $false
}

function Ensure-Server {
  param([string]$ProbeUrl)

  try {
    $null = Invoke-WebRequest -UseBasicParsing -Uri $ProbeUrl -TimeoutSec 5
    $script:reusedDevServer = $true
    return
  } catch {
  }

  $command = "`$env:PORT='$ResolvedPort'; Set-Location '$ProjectRoot'; npm run dev"
  $script:startedDevServer = Start-Process powershell `
    -ArgumentList "-NoProfile", "-Command", $command `
    -WorkingDirectory $ProjectRoot `
    -RedirectStandardOutput $DevOutLog `
    -RedirectStandardError $DevErrLog `
    -PassThru

  for ($attempt = 0; $attempt -lt 60; $attempt++) {
    Start-Sleep -Seconds 2
    try {
      $null = Invoke-WebRequest -UseBasicParsing -Uri $ProbeUrl -TimeoutSec 5
      return
    } catch {
      continue
    }
  }

  throw "Dev server did not become ready at $ProbeUrl. See $DevOutLog and $DevErrLog."
}

try {
  Require-Npx
  if ($Prod -and -not $HadBaseUrlInput -and -not $HadEnvBaseUrlInput) {
    $currentUri = [uri]$ResolvedBaseUrl
    if ($currentUri.Port -eq $ProjectBaselinePort -and -not (Test-PortBindable -HostName $currentUri.Host -Port $ProjectBaselinePort)) {
      if (Test-PortBindable -HostName $currentUri.Host -Port $HostFallbackPort) {
        $ResolvedBaseUrl = "$($currentUri.Scheme)://$($currentUri.Host):$HostFallbackPort"
      } else {
        throw "Neither baseline port $ProjectBaselinePort nor host fallback port $HostFallbackPort is bindable on this machine."
      }
    }
  }

  $ResolvedUri = [uri]$ResolvedBaseUrl
  $ResolvedPort = if ($ResolvedUri.IsDefaultPort) {
    if ($ResolvedUri.Scheme -eq "https") { 443 } else { 80 }
  } else {
    $ResolvedUri.Port
  }

  if (-not $Prod) {
    Ensure-Server -ProbeUrl "$ResolvedBaseUrl/zh"
  }

  $env:PLAYWRIGHT_BASE_URL = $ResolvedBaseUrl
  $env:SMOKE_BASE_URL = $ResolvedBaseUrl

  if ($Headed) {
    $env:PLAYWRIGHT_HEADED = "1"
  } else {
    Remove-Item Env:PLAYWRIGHT_HEADED -ErrorAction SilentlyContinue
  }

  if ($Prod) {
    $env:PLAYWRIGHT_MANAGE_SERVER = "1"
    $env:PLAYWRIGHT_SERVER_MODE = "prod"

    & npm run build
    if ($LASTEXITCODE -ne 0) {
      throw "Production smoke build step failed with exit code $LASTEXITCODE."
    }
  }

  Write-Host "[smoke] mode=$(if ($Prod) { 'prod' } else { 'dev' }) baseURL=$ResolvedBaseUrl headed=$([bool]$Headed)"

  $playwrightArgs = @(
    "playwright",
    "test",
    $(if ($Prod) { "tests/e2e/retained-surface-prod.spec.ts" } else { "tests/e2e/retained-surface-smoke.spec.ts" })
  )

  if ($Headed) {
    $playwrightArgs += "--headed"
  }

  & npx @playwrightArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Playwright test run failed with exit code $LASTEXITCODE."
  }
} finally {
  if ($startedDevServer -and -not $reusedDevServer) {
    try {
      Stop-Process -Id $startedDevServer.Id -Force
    } catch {
    }
  }
}
