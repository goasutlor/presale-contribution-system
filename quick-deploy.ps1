# Quick Deploy Script for Windows PowerShell
# One-click deployment to AWS App Runner

Write-Host "🚀 Quick Deploy - ASC3 Contribution System" -ForegroundColor Blue
Write-Host "==========================================" -ForegroundColor Blue

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI not found"
    }
    Write-Host "✅ AWS CLI is installed: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "  Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installing AWS CLI, run 'aws configure' to set up your credentials." -ForegroundColor Yellow
    Write-Host "You'll need:" -ForegroundColor Yellow
    Write-Host "  - AWS Access Key ID" -ForegroundColor White
    Write-Host "  - AWS Secret Access Key" -ForegroundColor White
    Write-Host "  - Default region (e.g., us-east-1)" -ForegroundColor White
    Write-Host "  - Default output format (e.g., json)" -ForegroundColor White
    exit 1
}

# Check if AWS CLI is configured
try {
    $callerIdentity = aws sts get-caller-identity 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI not configured"
    }
    Write-Host "✅ AWS CLI is configured" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI is not configured. Please run 'aws configure' first." -ForegroundColor Red
    Write-Host ""
    Write-Host "Run this command to configure AWS CLI:" -ForegroundColor Yellow
    Write-Host "  aws configure" -ForegroundColor White
    Write-Host ""
    Write-Host "You'll need:" -ForegroundColor Yellow
    Write-Host "  - AWS Access Key ID" -ForegroundColor White
    Write-Host "  - AWS Secret Access Key" -ForegroundColor White
    Write-Host "  - Default region (e.g., us-east-1)" -ForegroundColor White
    Write-Host "  - Default output format (e.g., json)" -ForegroundColor White
    exit 1
}

# Run deployment
Write-Host "🚀 Starting deployment..." -ForegroundColor Blue
Write-Host ""

& .\deploy-aws.ps1

Write-Host ""
Write-Host "🎉 Quick Deploy completed!" -ForegroundColor Green
Write-Host "📱 Your app should be available at the URL shown above" -ForegroundColor Cyan
Write-Host "🔗 Check AWS Console for more details" -ForegroundColor Cyan
