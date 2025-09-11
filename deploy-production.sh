#!/bin/bash

# Production Deployment Script for HTTPS
echo "🚀 Starting Production Deployment with HTTPS..."

# Check if running as root (not recommended for production)
if [ "$EUID" -eq 0 ]; then
  echo "⚠️  Warning: Running as root is not recommended for production"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check if SSL certificates exist
if [ ! -f "ssl/private-key.pem" ] || [ ! -f "ssl/certificate.pem" ]; then
  echo "❌ SSL certificates not found!"
  echo "🔧 Generating SSL certificates..."
  npm run ssl:generate
fi

# Set production environment
export NODE_ENV=production
export SSL_KEY_PATH=./ssl/private-key.pem
export SSL_CERT_PATH=./ssl/certificate.pem

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# Check if port 5443 is available
if lsof -Pi :5443 -sTCP:LISTEN -t >/dev/null ; then
  echo "⚠️  Port 5443 is already in use. Stopping existing process..."
  pkill -f "node.*https-server"
  sleep 2
fi

# Start HTTPS server
echo "🔒 Starting HTTPS server..."
npm run start:production &

# Wait for server to start
sleep 5

# Check if server is running
if curl -k -s https://localhost:5443/api/health > /dev/null; then
  echo "✅ HTTPS server is running successfully!"
  echo "🔗 Server URL: https://localhost:5443"
  echo "🔗 Health Check: https://localhost:5443/api/health"
  echo "🔗 Frontend: https://localhost:3000 (if running)"
  echo ""
  echo "📋 Next steps:"
  echo "1. Update your domain DNS to point to this server"
  echo "2. Replace self-signed certificates with real SSL certificates"
  echo "3. Update CORS_ORIGIN in environment variables"
  echo "4. Configure reverse proxy (nginx/apache) if needed"
  echo "5. Set up monitoring and logging"
else
  echo "❌ HTTPS server failed to start!"
  exit 1
fi
