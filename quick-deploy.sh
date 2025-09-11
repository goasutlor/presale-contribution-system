#!/bin/bash

# Quick Deploy Script - One-click deployment
# This script provides a simple way to deploy the application

set -e

echo "🚀 Quick Deploy - ASC3 Contribution System"
echo "=========================================="

# Check if we're on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "🪟 Windows detected. Running PowerShell script..."
    powershell -ExecutionPolicy Bypass -File deploy-aws.ps1
    exit 0
fi

# Check if we're on Linux/macOS
echo "🐧 Linux/macOS detected. Running bash script..."

# Make deploy script executable
chmod +x deploy-aws.sh

# Run deployment
./deploy-aws.sh

echo ""
echo "🎉 Quick Deploy completed!"
echo "📱 Your app should be available at the URL shown above"
echo "🔗 Check AWS Console for more details"
