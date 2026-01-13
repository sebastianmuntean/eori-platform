# PowerShell helper script for migrating data to Vercel Neon
# This script prompts for connection strings and runs the migration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EORI Platform - Neon Migration Tool  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for local database URL
Write-Host "Enter LOCAL database connection string (DATABASE_URL):" -ForegroundColor Yellow
Write-Host "Format: postgresql://user:password@host:port/database" -ForegroundColor Gray
$localDbUrl = Read-Host "DATABASE_URL"

if ([string]::IsNullOrWhiteSpace($localDbUrl)) {
    Write-Host "Error: DATABASE_URL is required" -ForegroundColor Red
    exit 1
}

# Prompt for Neon database URL
Write-Host ""
Write-Host "Enter VERCEL NEON database connection string:" -ForegroundColor Yellow
Write-Host "You can use POSTGRES_URL (Vercel standard) or NEON_DATABASE_URL" -ForegroundColor Gray
Write-Host "Format: postgresql://user:password@host:port/database" -ForegroundColor Gray
$neonDbUrl = Read-Host "POSTGRES_URL or NEON_DATABASE_URL"

if ([string]::IsNullOrWhiteSpace($neonDbUrl)) {
    Write-Host "Error: NEON_DATABASE_URL is required" -ForegroundColor Red
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
# Set both variables so script can use either
$env:NEON_DATABASE_URL = $neonDbUrl
$env:POSTGRES_URL = $neonDbUrl

npm run migrate:to-neon

# Clean up environment variables
Remove-Item Env:\DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:\NEON_DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:\POSTGRES_URL -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Migration completed!" -ForegroundColor Green

