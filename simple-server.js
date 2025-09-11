// Simple Express Server for Railway
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5001;

console.log('🚀 Starting Simple Server...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
  PORT: PORT
});

// Basic middleware
app.use(express.json());

// Health check endpoints
app.get('/', (req, res) => {
  console.log('Health check request received');
  res.status(200).json({
    status: 'OK',
    message: 'Simple Server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/health', (req, res) => {
  console.log('API Health check request received');
  res.status(200).json({
    status: 'OK',
    message: 'API is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple server running on port ${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/`);
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => {
    process.exit(0);
  });
});

console.log('Simple server setup complete');
