import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { tenantContext } from './middleware/tenant';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { contributionRoutes } from './routes/contributions';
import { reportRoutes } from './routes/reports';
import { testRoutes } from './routes/functionalTest';
import { globalRoutes } from './routes/global';
import { initializeDatabase } from './database/init';
import { Router } from 'express';
import { publicRoutes } from './routes/public';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Ensure NODE_ENV is set for Railway
if (!process.env.NODE_ENV && process.env.RAILWAY_ENVIRONMENT === 'production') {
  process.env.NODE_ENV = 'production';
}

// Disable HTTPS redirect on Railway to avoid breaking healthchecks and internal HTTP
// Railway terminates TLS at the edge and forwards HTTP internally
// If needed, enforce HTTPS at the reverse proxy level instead

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.railway.app"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
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

// Force production mode for Railway
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production';

// Tenant context middleware
app.use(tenantContext);

// Explicit favicon handler to avoid proxy 502s if static middleware is not yet ready
app.get('/favicon.ico', (req, res) => {
  try {
    const buildPath = path.join(__dirname, '../../client/build', 'favicon.ico');
    res.sendFile(buildPath, (err) => {
      if (err) {
        // Fallback: no content
        res.status(204).end();
      }
    });
  } catch (_err) {
    res.status(204).end();
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/global', globalRoutes);
app.use('/api/test', testRoutes);
app.use('/api/public', publicRoutes);

// Tenant-scoped API mounts: /t/:tenantPrefix/api/* (Phase 5)
const tenantApi = Router();
tenantApi.use('/auth', authRoutes);
tenantApi.use('/users', userRoutes);
tenantApi.use('/contributions', contributionRoutes);
tenantApi.use('/reports', reportRoutes);
tenantApi.use('/test', testRoutes);
app.use('/t/:tenantPrefix/api', tenantApi);

// Static files (for production build) - must be after API routes
if (isProduction) {
  const buildPath = path.join(__dirname, '../../client/build');
  console.log('🔍 Static files path:', buildPath);
  console.log('🔍 Build directory exists:', require('fs').existsSync(buildPath));
  
  // Debug middleware for static files
  app.use((req, res, next) => {
    if (req.path.startsWith('/static/')) {
      console.log('🔍 Static file request:', req.path);
    }
    next();
  });
  
  // Serve static files with explicit MIME types
  app.use('/static', express.static(path.join(buildPath, 'static'), {
    setHeaders: (res, path) => {
      console.log('🔍 Serving static file:', path);
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.ico')) {
        res.setHeader('Content-Type', 'image/x-icon');
      }
    }
  }));
  
  // Serve other static files
  app.use(express.static(buildPath, {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.ico')) {
        res.setHeader('Content-Type', 'image/x-icon');
      }
    }
  }));
}

// Health check endpoints - MUST be before static file serving
app.get('/api/health', (req, res) => {
  console.log('🔍 API Health check request received');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    app: 'Presale Contribution System',
    port: PORT,
    database: process.env.DATABASE_URL ? 'Available' : 'Not available'
  });
});

// Root health check for Railway - MUST be before static file serving
app.get('/', (req, res) => {
  console.log('🔍 Health check request received');
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Presale Contribution System API is running',
    version: '1.0.0',
    https: req.header('x-forwarded-proto') === 'https',
    port: PORT,
    database: process.env.DATABASE_URL ? 'Connected' : 'Not connected'
  });
});

// Serve React app for production
if (isProduction) {
  // Handle static files explicitly
  app.get('/static/css/*', (req, res) => {
    const filePath = path.join(__dirname, '../../client/build', req.path);
    console.log('🔍 Serving CSS file:', filePath);
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('❌ Error serving CSS file:', err);
        res.status(404).send('CSS file not found');
      }
    });
  });
  
  app.get('/static/js/*', (req, res) => {
    const filePath = path.join(__dirname, '../../client/build', req.path);
    console.log('🔍 Serving JS file:', filePath);
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('❌ Error serving JS file:', err);
        res.status(404).send('JS file not found');
      }
    });
  });
  
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../../client/build/index.html');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
  });
} else {
  // Root health check for development
  app.get('/', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      message: 'Presale Contribution System API is running',
      version: '1.0.0',
      https: req.header('x-forwarded-proto') === 'https'
    });
  });
  
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

// Start server immediately for health checks
console.log(`🚀 Starting server on port ${PORT}...`);
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔍 Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/`);
  console.log(`🔗 API Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🔐 Railway will handle HTTPS automatically`);
  console.log(`✅ Server is ready for health checks`);
});

// Handle server errors
server.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Process error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
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

// Initialize database in background
async function initializeDatabaseAsync() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Debug environment variables
    console.log('🔍 Environment Debug:', {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      isProduction: process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production',
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set'
    });
    
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('❌ Full error details:', error);
    // Don't exit - let the server continue running for health checks
    console.log('⚠️  Server will continue running without database');
  }
}

// Start database initialization in background
initializeDatabaseAsync();

export default app;
