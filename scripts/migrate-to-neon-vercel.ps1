# PowerShell script to migrate data to Vercel Neon using Vercel CLI
# This script automatically fetches the Neon connection string from Vercel

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EORI Platform - Neon Migration Tool  " -ForegroundColor Cyan
Write-Host "  (Using Vercel CLI)                    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host "Vercel CLI is not installed!" -ForegroundColor Red
    Write-Host "Install it with: npm i -g vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternatively, use: .\scripts\migrate-to-neon-helper.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in to Vercel
Write-Host "Checking Vercel authentication..." -ForegroundColor Yellow
$vercelWhoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to Vercel. Please run: vercel login" -ForegroundColor Red
    exit 1
}
Write-Host "Logged in as: $vercelWhoami" -ForegroundColor Green
Write-Host ""

# Get local database URL
Write-Host "Enter LOCAL database connection string (DATABASE_URL):" -ForegroundColor Yellow
Write-Host "Format: postgresql://user:password@host:port/database" -ForegroundColor Gray
$localDbUrl = Read-Host "DATABASE_URL"

if ([string]::IsNullOrWhiteSpace($localDbUrl)) {
    Write-Host "Error: DATABASE_URL is required" -ForegroundColor Red
    exit 1
}

# Try to get Neon connection string from Vercel
Write-Host ""
Write-Host "Fetching environment variables from Vercel..." -ForegroundColor Yellow

# Get current project name (if in a Vercel project)
$projectJson = Get-Content vercel.json -ErrorAction SilentlyContinue
$projectName = $null

# Try to get project name from package.json or vercel.json
if (Test-Path "vercel.json") {
    try {
        $vercelConfig = Get-Content vercel.json | ConvertFrom-Json
        $projectName = $vercelConfig.name
    } catch {
        # Ignore
    }
}

# Fetch environment variables from Vercel
Write-Host "Fetching POSTGRES_URL from Vercel..." -ForegroundColor Cyan
$envVars = vercel env ls 2>&1 | Out-String

if ($envVars -match "POSTGRES_URL|DATABASE_URL") {
    Write-Host "Found database environment variables in Vercel" -ForegroundColor Green
    
    # Try to pull environment variables
    Write-Host "Pulling environment variables..." -ForegroundColor Cyan
    vercel env pull .env.vercel 2>&1 | Out-Null
    
    if (Test-Path ".env.vercel") {
        $vercelEnv = Get-Content .env.vercel
        $neonDbUrl = $null
        
        foreach ($line in $vercelEnv) {
            if ($line -match "^POSTGRES_URL=(.+)") {
                $neonDbUrl = $matches[1].Trim('"').Trim("'")
                break
            } elseif ($line -match "^DATABASE_URL=(.+)") {
                # Check if it's a Neon URL (contains neon.tech)
                if ($matches[1] -match "neon\.tech") {
                    $neonDbUrl = $matches[1].Trim('"').Trim("'")
                    break
                }
            }
        }
        
        Remove-Item .env.vercel -ErrorAction SilentlyContinue
        
        if ($neonDbUrl) {
            Write-Host "Found Neon connection string from Vercel" -ForegroundColor Green
        } else {
            Write-Host "Could not find POSTGRES_URL in Vercel environment variables" -ForegroundColor Yellow
            Write-Host "Please enter it manually:" -ForegroundColor Yellow
            $neonDbUrl = Read-Host "NEON_DATABASE_URL or POSTGRES_URL"
        }
    } else {
        Write-Host "Could not pull environment variables. Please enter manually:" -ForegroundColor Yellow
        $neonDbUrl = Read-Host "NEON_DATABASE_URL or POSTGRES_URL"
    }
} else {
    Write-Host "Could not find database environment variables in Vercel" -ForegroundColor Yellow
    Write-Host "Please enter Neon connection string manually:" -ForegroundColor Yellow
    $neonDbUrl = Read-Host "NEON_DATABASE_URL or POSTGRES_URL"
}

if ([string]::IsNullOrWhiteSpace($neonDbUrl)) {
    Write-Host "Error: Neon database URL is required" -ForegroundColor Red
    exit 1
}

# Confirm before proceeding
Write-Host ""
Write-Host "WARNING: This will DELETE ALL DATA from Neon and replace it with local data!" -ForegroundColor Red
Write-Host "Local DB: $($localDbUrl -replace ':[^:@]+@', ':****@')" -ForegroundColor Blue
Write-Host "Neon DB:  $($neonDbUrl -replace ':[^:@]+@', ':****@')" -ForegroundColor Blue
Write-Host ""
$confirm = Read-Host "Type 'yes' to continue"

if ($confirm -ne 'yes') {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

# Set environment variables and run migration
Write-Host ""
Write-Host "Starting migration..." -ForegroundColor Green
Write-Host ""

$env:DATABASE_URL = $localDbUrl
$env:POSTGRES_URL = $neonDbUrl  # Set as POSTGRES_URL so script can use it

npm run migrate:to-neon

# Clean up environment variables
Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:\POSTGRES_URL -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Migration completed!" -ForegroundColor Green

