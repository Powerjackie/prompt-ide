param(
  [string]$BaseUrl = "",
  [switch]$Headed
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
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

function Require-Npx {
  if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    throw "npx is required to run the Playwright accessibility workflow."
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

try {
  Require-Npx

  if (-not $HadBaseUrlInput -and -not $HadEnvBaseUrlInput) {
    $currentUri = [uri]$ResolvedBaseUrl

    if ($currentUri.Port -eq $ProjectBaselinePort -and -not (Test-PortBindable -HostName $currentUri.Host -Port $ProjectBaselinePort)) {
      if (Test-PortBindable -HostName $currentUri.Host -Port $HostFallbackPort) {
        $ResolvedBaseUrl = "$($currentUri.Scheme)://$($currentUri.Host):$HostFallbackPort"
      } else {
        throw "Neither baseline port $ProjectBaselinePort nor host fallback port $HostFallbackPort is bindable on this machine."
      }
    }
  }

  $env:PLAYWRIGHT_BASE_URL = $ResolvedBaseUrl
  $env:SMOKE_BASE_URL = $ResolvedBaseUrl
  $env:PLAYWRIGHT_MANAGE_SERVER = "1"
  Remove-Item Env:PLAYWRIGHT_SERVER_MODE -ErrorAction SilentlyContinue

  if ($Headed) {
    $env:PLAYWRIGHT_HEADED = "1"
  } else {
    Remove-Item Env:PLAYWRIGHT_HEADED -ErrorAction SilentlyContinue
  }

  Write-Host "[a11y] mode=dev baseURL=$ResolvedBaseUrl headed=$([bool]$Headed)"

  $playwrightArgs = @("playwright", "test", "tests/e2e/accessibility-gate.spec.ts")
  if ($Headed) {
    $playwrightArgs += "--headed"
  }

  & npx @playwrightArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Playwright accessibility run failed with exit code $LASTEXITCODE."
  }
} finally {
  Remove-Item Env:PLAYWRIGHT_HEADED -ErrorAction SilentlyContinue
  Remove-Item Env:PLAYWRIGHT_SERVER_MODE -ErrorAction SilentlyContinue
}
