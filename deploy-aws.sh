#!/bin/bash

# AWS App Runner Deployment Script
# This script automates the deployment to AWS App Runner

set -e

echo "🚀 Starting AWS App Runner Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="presale-contribution-system"
REGION="us-east-1"
GITHUB_REPO="goasutlor/presale-contribution-system"
BRANCH="main"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  App Name: $APP_NAME"
echo "  Region: $REGION"
echo "  GitHub Repo: $GITHUB_REPO"
echo "  Branch: $BRANCH"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    echo "  Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is configured${NC}"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI is not installed. Installing...${NC}"
    # Install GitHub CLI (Ubuntu/Debian)
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    sudo apt update
    sudo apt install gh -y
fi

# Check if GitHub CLI is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI is not authenticated. Please run 'gh auth login' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is authenticated${NC}"

# Create IAM role for App Runner
echo -e "${BLUE}🔧 Creating IAM role for App Runner...${NC}"

# Create trust policy
cat > trust-policy.json << EOF
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
EOF

# Create IAM role
aws iam create-role \
    --role-name AppRunnerServiceRole \
    --assume-role-policy-document file://trust-policy.json \
    --region $REGION || echo "Role already exists"

# Attach policy
aws iam attach-role-policy \
    --role-name AppRunnerServiceRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AppRunnerServicePolicyForECRAccess \
    --region $REGION || echo "Policy already attached"

# Create App Runner service
echo -e "${BLUE}🚀 Creating App Runner service...${NC}"

# Create service configuration
cat > apprunner-service.json << EOF
{
  "ServiceName": "$APP_NAME",
  "SourceConfiguration": {
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/$GITHUB_REPO",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "$BRANCH"
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
    "InstanceRoleArn": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/AppRunnerServiceRole"
  },
  "AutoScalingConfigurationArn": "arn:aws:apprunner:$REGION:$(aws sts get-caller-identity --query Account --output text):autoscalingconfiguration/DefaultConfiguration/1/00000000000000000000000000000001"
}
EOF

# Create the service
aws apprunner create-service \
    --cli-input-json file://apprunner-service.json \
    --region $REGION

echo -e "${GREEN}✅ App Runner service created successfully!${NC}"

# Get service URL
echo -e "${BLUE}🔍 Getting service URL...${NC}"
SERVICE_URL=$(aws apprunner describe-service \
    --service-arn "arn:aws:apprunner:$REGION:$(aws sts get-caller-identity --query Account --output text):service/$APP_NAME" \
    --region $REGION \
    --query 'Service.ServiceUrl' \
    --output text)

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}📱 Service URL: https://$SERVICE_URL${NC}"
echo -e "${BLUE}🔗 AWS Console: https://console.aws.amazon.com/apprunner/home?region=$REGION#/services${NC}"

# Clean up
rm -f trust-policy.json apprunner-service.json

echo -e "${GREEN}✨ Your application is now live on AWS App Runner!${NC}"
