// Minimal Server for Healthcheck Testing
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5001;

console.log('🚀 Starting minimal server...');
console.log('🔍 Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
  PORT: PORT,
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set'
});

// Basic healthcheck endpoint
app.get('/', (req, res) => {
  console.log('🔍 Health check request received');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Minimal server is running',
    port: PORT
  });
});

app.get('/api/health', (req, res) => {
  console.log('🔍 API Health check request received');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'API is running',
    port: PORT
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/`);
  console.log(`🔗 API Health check: http://0.0.0.0:${PORT}/api/health`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

console.log('✅ Minimal server setup complete');
