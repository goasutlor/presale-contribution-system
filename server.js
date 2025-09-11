// Minimal working server for Railway
const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

console.log('Starting minimal server...');
console.log('Port:', PORT);
console.log('Environment:', process.env.NODE_ENV);

// Basic healthcheck
app.get('/', (req, res) => {
  console.log('Health check received');
  
  // Check if it's a browser request (has Accept: text/html)
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/html')) {
    // Return HTML page for browser
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Presale Contribution System</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h1>Presale Contribution System</h1>
          <p>Server is running on port ${PORT}</p>
          <p>Status: OK</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p><a href="/api/health">API Health Check</a></p>
        </body>
      </html>
    `);
  } else {
    // Return JSON for API requests
    res.status(200).json({
      status: 'OK',
      message: 'Server is running',
      port: PORT,
      timestamp: new Date().toISOString()
    });
  }
});

// Favicon handler
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

app.get('/api/health', (req, res) => {
  console.log('API health check received');
  res.status(200).json({
    status: 'OK',
    message: 'API is running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/`);
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => {
    process.exit(0);
  });
});

console.log('Server setup complete');
