param(
    [Parameter(Mandatory = $false)]
    [string]$SourceDir = "D:\Flipkart\ECommerceFront",

    [Parameter(Mandatory = $false)]
    [string]$DestDir = "D:\publish\ECommerceFront",

    # If set, removes the destination folder before copying.
    [Parameter(Mandatory = $false)]
    [switch]$CleanDest
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Directory($path, $name) {
    if (-not (Test-Path -LiteralPath $path)) {
        throw "$name not found: $path"
    }
}

function Assert-Command($cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $cmd"
    }
}

Write-Host "=== Next.js Build -> IIS Publish Folder ===" -ForegroundColor Cyan
Write-Host "Source: $SourceDir"
Write-Host "Dest:   $DestDir"
Write-Host ""

Assert-Command "node"
Assert-Command "npm"
Assert-Directory $SourceDir "SourceDir"

$packageJson = Join-Path $SourceDir "package.json"
if (-not (Test-Path -LiteralPath $packageJson)) {
    throw "package.json not found: $packageJson"
}

# Node/Next standalone expectations:
# - .next/standalone (server.js + needed runtime files)
# - .next/static (static assets)
# - public (public assets)

if ($CleanDest -and (Test-Path -LiteralPath $DestDir)) {
    Write-Host "Cleaning destination folder..." -ForegroundColor Yellow
    Remove-Item -LiteralPath $DestDir -Recurse -Force
}

Write-Host "Ensuring destination exists..."
New-Item -ItemType Directory -Path $DestDir -Force | Out-Null

Write-Host ""
Write-Host "Installing dependencies..."
$lockPath = Join-Path $SourceDir "package-lock.json"

Push-Location $SourceDir
try {
    if (Test-Path -LiteralPath $lockPath) {
        # Use npm ci if lock file exists (faster + deterministic)
        npm ci
    } else {
        npm install
    }

    Write-Host ""
    Write-Host "Running production build..."
    npm run build
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath (Join-Path $SourceDir ".next\standalone"))) {
    throw "Build failed: missing .next/standalone in $SourceDir"
}

Write-Host ""
Write-Host "Copying standalone output..."
$standaloneSrc = Join-Path $SourceDir ".next\standalone"
Copy-Item -Path (Join-Path $standaloneSrc "*") -Destination $DestDir -Recurse -Force

Write-Host "Copying Next static assets..."
$nextStaticSrc = Join-Path $SourceDir ".next\static"
$destNextStatic = Join-Path $DestDir ".next\static"
if (-not (Test-Path -LiteralPath $nextStaticSrc)) {
    throw "Build failed: missing .next/static in $SourceDir"
}
New-Item -ItemType Directory -Path $destNextStatic -Force | Out-Null
Copy-Item -Path (Join-Path $nextStaticSrc "*") -Destination $destNextStatic -Recurse -Force

Write-Host "Copying public assets..."
$publicSrc = Join-Path $SourceDir "public"
if (-not (Test-Path -LiteralPath $publicSrc)) {
    throw "Missing public folder: $publicSrc"
}
New-Item -ItemType Directory -Path (Join-Path $DestDir "public") -Force | Out-Null
Copy-Item -Path (Join-Path $publicSrc "*") -Destination (Join-Path $DestDir "public") -Recurse -Force

# Useful metadata file
$buildIdPath = Join-Path $SourceDir ".next\BUILD_ID"
$metaPath = Join-Path $DestDir "build_info.txt"
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$buildId = ""
if (Test-Path -LiteralPath $buildIdPath) {
    $buildId = Get-Content -LiteralPath $buildIdPath -Raw
}

@"
Build timestamp: $timestamp
Build ID: $buildId
Source: $SourceDir
Dest: $DestDir
Standalone: $standaloneSrc
"@ | Set-Content -LiteralPath $metaPath -Encoding UTF8

Write-Host ""
Write-Host "Publish folder is ready:" -ForegroundColor Green
Write-Host "  $DestDir"
Write-Host ""
Write-Host "Next step (manual run):"
Write-Host "  cd `"$DestDir`""
Write-Host "  node server.js"

