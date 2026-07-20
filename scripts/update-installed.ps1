[CmdletBinding()]
param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$package = Get-Content -Raw (Join-Path $repositoryRoot 'package.json') | ConvertFrom-Json
$installer = Join-Path $repositoryRoot "release\$($package.name)-$($package.version)-setup.exe"
$application = Join-Path $env:LOCALAPPDATA 'Programs\WinAgent Terminal\WinAgent Terminal.exe'

if (-not (Test-Path -LiteralPath $installer -PathType Leaf)) {
  throw "Installer not found: $installer. Run npm run build first."
}

$running = @(Get-Process -Name 'WinAgent Terminal' -ErrorAction SilentlyContinue)
if ($running.Count -gt 0) {
  if (-not $Force) {
    throw 'WinAgent Terminal is running. Close it or run this script with -Force.'
  }
  $running | Stop-Process -Force
  Start-Sleep -Milliseconds 800
}

$setup = Start-Process -FilePath $installer -ArgumentList '/S' -Wait -PassThru
if ($setup.ExitCode -ne 0) {
  throw "WinAgent installer failed with exit code $($setup.ExitCode)."
}
if (-not (Test-Path -LiteralPath $application -PathType Leaf)) {
  throw "Updated application was not found: $application"
}

Start-Process -FilePath $application
Write-Output 'WinAgent Terminal updated and restarted.'
