# AWS App Runner Deployment Script for Windows PowerShell
# This script automates the deployment to AWS App Runner

param(
    [string]$AppName = "presale-contribution-system",
    [string]$Region = "us-east-1",
    [string]$GitHubRepo = "goasutlor/presale-contribution-system",
    [string]$Branch = "main"
)

Write-Host "Starting AWS App Runner Deployment..." -ForegroundColor Blue

# Configuration
Write-Host "Deployment Configuration:" -ForegroundColor Cyan
Write-Host "  App Name: $AppName" -ForegroundColor White
Write-Host "  Region: $Region" -ForegroundColor White
Write-Host "  GitHub Repo: $GitHubRepo" -ForegroundColor White
Write-Host "  Branch: $Branch" -ForegroundColor White
Write-Host ""

# Check if AWS CLI is installed
try {
    $awsPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
    if (Test-Path $awsPath) {
        $awsVersion = & $awsPath --version 2>$null
        Write-Host "AWS CLI is installed: $awsVersion" -ForegroundColor Green
    } else {
        throw "AWS CLI not found"
    }
} catch {
    Write-Host "AWS CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "  Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html" -ForegroundColor Yellow
    exit 1
}

# Check if AWS CLI is configured
try {
    $awsPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
    $callerIdentity = & $awsPath sts get-caller-identity 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI not configured"
    }
    Write-Host "AWS CLI is configured" -ForegroundColor Green
} catch {
    Write-Host "AWS CLI is not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Create IAM role for App Runner
Write-Host "Creating IAM role for App Runner..." -ForegroundColor Blue

# Create trust policy
$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "build.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

$trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding UTF8

# Create IAM role
Write-Host "  Creating IAM role..." -ForegroundColor Yellow
& $awsPath iam create-role --role-name AppRunnerServiceRole --assume-role-policy-document file://trust-policy.json --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Role already exists, continuing..." -ForegroundColor Yellow
}

# Attach policy
Write-Host "  Attaching policy..." -ForegroundColor Yellow
& $awsPath iam attach-role-policy --role-name AppRunnerServiceRole --policy-arn "arn:aws:iam::aws:policy/service-role/AppRunnerServicePolicyForECRAccess" --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Policy already attached, continuing..." -ForegroundColor Yellow
}

# Get AWS Account ID
$accountId = & $awsPath sts get-caller-identity --query Account --output text

# Create App Runner service
Write-Host "Creating App Runner service..." -ForegroundColor Blue

# Create service configuration
$serviceConfig = @"
{
  "ServiceName": "$AppName",
  "SourceConfiguration": {
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/$GitHubRepo",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "$Branch"
      },
      "CodeConfiguration": {
        "ConfigurationSource": "REPOSITORY",
        "CodeConfigurationValues": {
          "Runtime": "NODEJS_18",
          "BuildCommand": "npm cache clean --force && npm install --legacy-peer-deps --force && cd client && npm install --legacy-peer-deps --force && npm run build",
          "StartCommand": "npm start",
          "RuntimeEnvironmentVariables": {
            "NODE_ENV": "production",
            "PORT": "5001",
            "JWT_SECRET": "your-super-secret-jwt-key-change-in-production",
            "DB_PATH": "/tmp/data/presale_contributions.db"
          }
        }
      }
    }
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB",
    "InstanceRoleArn": "arn:aws:iam::${accountId}:role/AppRunnerServiceRole"
  }
}
"@

$serviceConfig | Out-File -FilePath "apprunner-service.json" -Encoding UTF8

# Create the service
Write-Host "  Creating service..." -ForegroundColor Yellow
& $awsPath apprunner create-service --cli-input-json file://apprunner-service.json --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host "App Runner service created successfully!" -ForegroundColor Green
    
    # Get service URL
    Write-Host "Getting service URL..." -ForegroundColor Blue
    Start-Sleep -Seconds 10  # Wait for service to be created
    
    $serviceArn = "arn:aws:apprunner:${Region}:${accountId}:service/${AppName}"
    $serviceUrl = & $awsPath apprunner describe-service --service-arn $serviceArn --region $Region --query 'Service.ServiceUrl' --output text
    
    Write-Host "Deployment completed successfully!" -ForegroundColor Green
    Write-Host "Service URL: https://$serviceUrl" -ForegroundColor Cyan
    Write-Host "AWS Console: https://console.aws.amazon.com/apprunner/home?region=$Region#/services" -ForegroundColor Cyan
} else {
    Write-Host "Failed to create App Runner service" -ForegroundColor Red
    Write-Host "  Check AWS Console for details" -ForegroundColor Yellow
}

# Clean up
Remove-Item -Path "trust-policy.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apprunner-service.json" -Force -ErrorAction SilentlyContinue

Write-Host "Deployment script completed!" -ForegroundColor Green
