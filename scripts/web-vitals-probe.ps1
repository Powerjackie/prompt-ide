param(
  [string]$BaseUrl = ""
)

$ErrorActionPreference = "Stop"

$ProjectBaselinePort = 3000
$HostFallbackPort = 5173

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

$HadBaseUrlInput = [bool]$BaseUrl.Trim()
$ResolvedBaseUrl = if ($HadBaseUrlInput) {
  $BaseUrl.Trim().TrimEnd("/")
} elseif ($env:PLAYWRIGHT_BASE_URL) {
  $env:PLAYWRIGHT_BASE_URL.Trim().TrimEnd("/")
} else {
  "http://127.0.0.1:$ProjectBaselinePort"
}

$ResolvedUri = [uri]$ResolvedBaseUrl
$ResolvedPort = if ($ResolvedUri.IsDefaultPort) {
  if ($ResolvedUri.Scheme -eq "https") { 443 } else { 80 }
} else {
  $ResolvedUri.Port
}

if (-not $HadBaseUrlInput -and -not $env:PLAYWRIGHT_BASE_URL) {
  if ($ResolvedPort -eq $ProjectBaselinePort -and -not (Test-PortBindable -HostName $ResolvedUri.Host -Port $ProjectBaselinePort)) {
    if (Test-PortBindable -HostName $ResolvedUri.Host -Port $HostFallbackPort) {
      $ResolvedBaseUrl = "$($ResolvedUri.Scheme)://$($ResolvedUri.Host):$HostFallbackPort"
    } else {
      throw "Neither baseline port $ProjectBaselinePort nor host fallback port $HostFallbackPort is bindable on this machine."
    }
  }
}

$env:PLAYWRIGHT_BASE_URL = $ResolvedBaseUrl
$env:PLAYWRIGHT_MANAGE_SERVER = "1"
$env:PLAYWRIGHT_SERVER_MODE = "dev"
$env:NEXT_PUBLIC_WEB_VITALS_DEBUG = "1"

Write-Host "[web-vitals] probe baseURL=$ResolvedBaseUrl"

& npx playwright test tests/e2e/web-vitals-probe.spec.ts
if ($LASTEXITCODE -ne 0) {
  throw "Web vitals probe failed with exit code $LASTEXITCODE."
}
