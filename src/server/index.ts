import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { contributionRoutes } from './routes/contributions';
import { reportRoutes } from './routes/reports';
import { testRoutes } from './routes/functionalTest';
import { initializeDatabase } from './database/init';

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow all origins in production for Railway
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Static files (for production build)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/test', testRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root health check for Railway
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Presale Contribution System API is running'
  });
});

// Serve React app for production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({ 
      error: 'Route not found',
      path: req.originalUrl 
    });
  });
}

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // Check if HTTPS is enabled
    const isHttps = process.env.NODE_ENV === 'production' && process.env.HTTPS_PORT;
    const httpsPort = process.env.HTTPS_PORT || 5443;
    
    console.log('🔍 Debug HTTPS:', {
      NODE_ENV: process.env.NODE_ENV,
      HTTPS_PORT: process.env.HTTPS_PORT,
      isHttps: isHttps,
      httpsPort: httpsPort
    });
    
    // Force HTTPS if HTTPS_PORT is set
    if (process.env.HTTPS_PORT) {
      console.log('🔐 Forcing HTTPS mode...');
      const https = require('https');
      const fs = require('fs');
      
      try {
        const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/private-key.pem', 'utf8');
        const certificate = fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/certificate.pem', 'utf8');
        
        const credentials = { key: privateKey, cert: certificate };
        const httpsServer = https.createServer(credentials, app);
        
        httpsServer.listen(httpsPort, () => {
          console.log(`🔐 HTTPS Server running on port ${httpsPort}`);
          console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
          console.log(`🔗 Health check: https://localhost:${httpsPort}/api/health`);
        });
        return; // Exit early to prevent HTTP server
      } catch (sslError) {
        console.error('❌ SSL Error:', (sslError as Error).message);
        console.warn('⚠️ Falling back to HTTP');
      }
    }
    
    if (isHttps) {
      // HTTPS Server
      const https = require('https');
      const fs = require('fs');
      
      try {
        const privateKey = fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/private-key.pem', 'utf8');
        const certificate = fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/certificate.pem', 'utf8');
        
        const credentials = { key: privateKey, cert: certificate };
        const httpsServer = https.createServer(credentials, app);
        
        httpsServer.listen(httpsPort, () => {
          console.log(`🔐 HTTPS Server running on port ${httpsPort}`);
          console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
          console.log(`🔗 Health check: https://localhost:${httpsPort}/api/health`);
        });
      } catch (sslError) {
        console.warn('⚠️ SSL certificates not found, falling back to HTTP');
        app.listen(PORT, () => {
          console.log(`🚀 HTTP Server running on port ${PORT}`);
          console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
          console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
        });
      }
    } else {
      // HTTP Server
      app.listen(PORT, () => {
        console.log(`🚀 HTTP Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
