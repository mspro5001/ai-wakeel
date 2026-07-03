Write-Host "🚀 AI Wakeel - Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if Render CLI is installed
$renderCli = Get-Command "render" -ErrorAction SilentlyContinue
if (-not $renderCli) {
    Write-Host "📦 Render CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @render/cli
}

# Install dependencies
Write-Host "📦 Installing server dependencies..." -ForegroundColor Green
Set-Location (Join-Path $PSScriptRoot "..")
npm install

Write-Host "📦 Installing client dependencies..." -ForegroundColor Green
Set-Location (Join-Path $PSScriptRoot "..\client")
npm install

Write-Host "🏗️  Building client..." -ForegroundColor Green
npm run build

Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a free account at https://render.com" -ForegroundColor White
Write-Host "2. Connect your GitHub repository" -ForegroundColor White
Write-Host "3. Use render.yaml in the deploy folder" -ForegroundColor White
Write-Host "4. Set environment variables in Render dashboard" -ForegroundColor White
Write-Host "5. Deploy!" -ForegroundColor White
