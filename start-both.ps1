# Start Both Frontend and Backend Script (HTTPS Production Mode)
Write-Host "Starting Presale Contribution System (HTTPS Production Mode)..." -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Cyan

# Stop old processes
Write-Host "Stopping old processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Clear Ports
Write-Host "Clearing ports..." -ForegroundColor Yellow
try {
    # Check port 3000
    $port3000 = netstat -ano | findstr ":3000"
    if ($port3000) {
        Write-Host "Found process using port 3000" -ForegroundColor Yellow
        $port3000 | ForEach-Object {
            $parts = $_ -split '\s+'
            if ($parts.Length -gt 4) {
                $processId = $parts[-1]
                if ($processId -match '^\d+$') {
                    Write-Host "Stopping process PID: $processId (port 3000)" -ForegroundColor Yellow
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
    
    # Check port 5001
    $port5001 = netstat -ano | findstr ":5001"
    if ($port5001) {
        Write-Host "Found process using port 5001" -ForegroundColor Yellow
        $port5001 | ForEach-Object {
            $parts = $_ -split '\s+'
            if ($parts.Length -gt 4) {
                $processId = $parts[-1]
                if ($processId -match '^\d+$') {
                    Write-Host "Stopping process PID: $processId (port 5001)" -ForegroundColor Yellow
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
    
    Write-Host "Port clearing completed" -ForegroundColor Green
    Start-Sleep -Seconds 2
} catch {
    Write-Host "Cannot clear ports: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "client/node_modules")) {
    Write-Host "Installing client dependencies..." -ForegroundColor Yellow
    cd client
    npm install --legacy-peer-deps
    cd ..
}

# Build Application
Write-Host "Building Application..." -ForegroundColor Yellow
npm run build

# Start Backend (Production)
Write-Host "Starting Backend (Production)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start" -WindowStyle Normal

# Wait for Backend
Write-Host "Waiting for Backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check Backend
$backendRunning = $false
for ($i = 1; $i -le 10; $i++) {
    $port5001 = netstat -an | findstr ":5001"
    if ($port5001) {
        Write-Host "Backend is running" -ForegroundColor Green
        $backendRunning = $true
        break
    }
    Write-Host "Waiting for Backend... ($i/10)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

if (-not $backendRunning) {
    Write-Host "Backend failed to start" -ForegroundColor Red
    exit 1
}

# Start Frontend (Production Build)
Write-Host "Starting Frontend (Production Build)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npx serve -s client/build -l 3000" -WindowStyle Normal

# Wait for Frontend
Write-Host "Waiting for Frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Check Frontend
$frontendRunning = $false
for ($i = 1; $i -le 10; $i++) {
    $port3000 = netstat -an | findstr ":3000"
    if ($port3000) {
        Write-Host "Frontend is running" -ForegroundColor Green
        $frontendRunning = $true
        break
    }
    Write-Host "Waiting for Frontend... ($i/10)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

# Show result
Write-Host ""
Write-Host "Production System started successfully!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5001" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Login: admin@presale.com / password" -ForegroundColor Yellow
Write-Host "Open Browser: http://localhost:3000" -ForegroundColor Blue
Write-Host ""
Write-Host "Production Mode Features:" -ForegroundColor Cyan
Write-Host "- Optimized build" -ForegroundColor White
Write-Host "- Production server" -ForegroundColor White
Write-Host "- Static file serving" -ForegroundColor White
Write-Host "- Ready for Docker deployment" -ForegroundColor White

Write-Host ""
Write-Host "Press Enter to close..." -ForegroundColor Gray
Read-Host