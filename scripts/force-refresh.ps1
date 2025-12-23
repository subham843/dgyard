# Force Refresh Script for Home Page
# Run this script to completely clear all caches

Write-Host "=== Force Refresh Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running Node processes
Write-Host "Step 1: Stopping Node processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "✓ Node processes stopped" -ForegroundColor Green

# Step 2: Clear Next.js cache
Write-Host "Step 2: Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Next.js cache cleared" -ForegroundColor Green
} else {
    Write-Host "✓ No .next folder found" -ForegroundColor Green
}

# Step 3: Clear node_modules cache
Write-Host "Step 3: Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Node modules cache cleared" -ForegroundColor Green
} else {
    Write-Host "✓ No node_modules cache found" -ForegroundColor Green
}

# Step 4: Clear npm cache
Write-Host "Step 4: Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>&1 | Out-Null
Write-Host "✓ NPM cache cleared" -ForegroundColor Green

Write-Host ""
Write-Host "=== Cache Clear Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Open browser in Incognito/Private mode" -ForegroundColor White
Write-Host "3. Go to: http://localhost:3000" -ForegroundColor White
Write-Host "4. Look for version badge in bottom-right corner (dev mode)" -ForegroundColor White
Write-Host ""
Write-Host "If you see 'Page v2.0.0-unified-booking' in bottom-right, latest version is loaded!" -ForegroundColor Green
Write-Host ""












