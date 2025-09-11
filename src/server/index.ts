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

// Force HTTPS in production (Railway handles this automatically)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contributions', contributionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/test', testRoutes);

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    app: 'Presale Contribution System'
  });
});

// Force production mode for Railway
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production';

// Serve React app for production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
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

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    // Debug environment variables
    console.log('🔍 Environment Debug:', {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      isProduction: process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT === 'production',
      PORT: process.env.PORT
    });
    
    // Railway handles HTTPS automatically, just start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Railway will handle HTTPS automatically`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
