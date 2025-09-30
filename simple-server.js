const express = require('express');
const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Health check endpoint - must work immediately
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check requested at', new Date().toISOString());
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    railway: process.env.RAILWAY_ENVIRONMENT ? 'true' : 'false',
    uptime: process.uptime(),
    message: 'Server is running and ready'
  });
});

// Root health check endpoint for Railway
app.get('/health', (req, res) => {
  console.log('🔍 Root health check requested at', new Date().toISOString());
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    railway: process.env.RAILWAY_ENVIRONMENT ? 'true' : 'false',
    message: 'Server is running and ready'
  });
});

// Basic root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Presale Contribution System API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔗 API Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`✅ Server is ready for health checks`);
  console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔍 Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
  console.log(`🔍 PORT: ${PORT}`);
});

// Test health check immediately
setTimeout(() => {
  console.log('🔍 Testing health check...');
  const http = require('http');
  const options = {
    hostname: '0.0.0.0',
    port: PORT,
    path: '/api/health',
    method: 'GET'
  };
  const req = http.request(options, (res) => {
    console.log(`✅ Health check test: ${res.statusCode}`);
  });
  req.on('error', (err) => {
    console.error('❌ Health check test failed:', err);
  });
  req.end();
}, 1000);

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  // Don't exit - let Railway health checks work
});

// Process error handling - don't exit for Railway health checks
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.log('⚠️  Server will continue running for health checks');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('⚠️  Server will continue running for health checks');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

console.log('🚀 Starting simple server for Railway health checks...');