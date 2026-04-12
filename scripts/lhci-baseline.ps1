param(
  [string]$BaseUrl = ""
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
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
} elseif ($env:LHCI_BASE_URL) {
  $env:LHCI_BASE_URL.Trim().TrimEnd("/")
} else {
  "http://127.0.0.1:$ProjectBaselinePort"
}

$ResolvedUri = [uri]$ResolvedBaseUrl
$ResolvedPort = if ($ResolvedUri.IsDefaultPort) {
  if ($ResolvedUri.Scheme -eq "https") { 443 } else { 80 }
} else {
  $ResolvedUri.Port
}

if (-not $HadBaseUrlInput -and -not $env:LHCI_BASE_URL) {
  if ($ResolvedPort -eq $ProjectBaselinePort -and -not (Test-PortBindable -HostName $ResolvedUri.Host -Port $ProjectBaselinePort)) {
    if (Test-PortBindable -HostName $ResolvedUri.Host -Port $HostFallbackPort) {
      $ResolvedBaseUrl = "$($ResolvedUri.Scheme)://$($ResolvedUri.Host):$HostFallbackPort"
      $ResolvedPort = $HostFallbackPort
    } else {
      throw "Neither baseline port $ProjectBaselinePort nor host fallback port $HostFallbackPort is bindable on this machine."
    }
  }
}

$env:LHCI_BASE_URL = $ResolvedBaseUrl
$env:LHCI_PORT = "$ResolvedPort"

$resolvedChromePath = & node -e "console.log(require('playwright').chromium.executablePath())"
if ($LASTEXITCODE -eq 0 -and $resolvedChromePath) {
  $env:LHCI_CHROME_PATH = $resolvedChromePath.Trim()
}

Write-Host "[lhci] baseURL=$ResolvedBaseUrl"

Set-Location $ProjectRoot

& npm run build
if ($LASTEXITCODE -ne 0) {
  throw "LHCI build step failed with exit code $LASTEXITCODE."
}

& npm run perf:lhci:run
if ($LASTEXITCODE -ne 0) {
  throw "LHCI collect/assert failed with exit code $LASTEXITCODE."
}
