# Test HTTPS Production Mode
Write-Host "🔐 Testing HTTPS Production Mode..." -ForegroundColor Green

# Set environment variables
$env:NODE_ENV = "production"
$env:HTTPS_PORT = "5443"
$env:SSL_KEY_PATH = "./ssl/private-key.pem"
$env:SSL_CERT_PATH = "./ssl/certificate.pem"

Write-Host "📊 Environment: $env:NODE_ENV" -ForegroundColor Yellow
Write-Host "🔐 HTTPS Port: $env:HTTPS_PORT" -ForegroundColor Yellow
Write-Host "🔑 SSL Key: $env:SSL_KEY_PATH" -ForegroundColor Yellow
Write-Host "📜 SSL Cert: $env:SSL_CERT_PATH" -ForegroundColor Yellow

# Start the server
Write-Host "Starting HTTPS Server..." -ForegroundColor Green
node dist/server/index.js
