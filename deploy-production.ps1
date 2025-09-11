# Production Deployment Script for HTTPS
Write-Host "🚀 Starting Production Deployment with HTTPS..." -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if ($isAdmin) {
    Write-Host "⚠️  Warning: Running as administrator is not recommended for production" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Check if SSL certificates exist
if (!(Test-Path "ssl/private-key.pem") -or !(Test-Path "ssl/certificate.pem")) {
    Write-Host "❌ SSL certificates not found!" -ForegroundColor Red
    Write-Host "🔧 Generating SSL certificates..." -ForegroundColor Yellow
    npm run ssl:generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to generate SSL certificates!" -ForegroundColor Red
        exit 1
    }
}

# Set production environment
$env:NODE_ENV = "production"
$env:SSL_KEY_PATH = "./ssl/private-key.pem"
$env:SSL_CERT_PATH = "./ssl/certificate.pem"

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Check if port 5443 is available
$portCheck = Get-NetTCPConnection -LocalPort 5443 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "⚠️  Port 5443 is already in use. Stopping existing process..." -ForegroundColor Yellow
    Get-Process | Where-Object {$_.ProcessName -eq "node" -and $_.CommandLine -like "*https-server*"} | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Start HTTPS server
Write-Host "🔒 Starting HTTPS server..." -ForegroundColor Yellow
Start-Process -FilePath "node" -ArgumentList "https-server.js" -WindowStyle Hidden

# Wait for server to start
Start-Sleep -Seconds 5

# Check if server is running
try {
    $response = Invoke-WebRequest -Uri "https://localhost:5443/api/health" -SkipCertificateCheck -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ HTTPS server is running successfully!" -ForegroundColor Green
        Write-Host "🔗 Server URL: https://localhost:5443" -ForegroundColor Cyan
        Write-Host "🔗 Health Check: https://localhost:5443/api/health" -ForegroundColor Cyan
        Write-Host "🔗 Frontend: https://localhost:3000 (if running)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Yellow
        Write-Host "1. Update your domain DNS to point to this server" -ForegroundColor White
        Write-Host "2. Replace self-signed certificates with real SSL certificates" -ForegroundColor White
        Write-Host "3. Update CORS_ORIGIN in environment variables" -ForegroundColor White
        Write-Host "4. Configure reverse proxy (nginx/apache) if needed" -ForegroundColor White
        Write-Host "5. Set up monitoring and logging" -ForegroundColor White
    } else {
        Write-Host "❌ HTTPS server failed to start!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ HTTPS server failed to start!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
