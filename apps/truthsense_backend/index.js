require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Import services and database
const { syncDatabase } = require('./models');
const emailService = require('./services/emailService');
const authService = require('./services/authService');

// Import routes
const authRoutes = require('./routes/auth');
const recordingRoutes = require('./routes/recordings');
const testRoutes = require('./routes/test');

// Import middleware
const { apiLimiter } = require('./middleware/rateLimiter');
const { logRequest } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      "upgrade-insecure-requests": null
    }
  },
  hsts: process.env.NODE_ENV === 'production'
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://truthsense.com', 'https://www.truthsense.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (add this after body parsers)
app.use(logRequest);

// Rate limiting
app.use('/api', apiLimiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TruthSense API Documentation'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to TruthSense Backend API',
    documentation: '/api-docs',
    health: '/health'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/test', testRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    documentation: '/api-docs'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Starting TruthSense Backend...');
    
    // Test database connection
    // await testConnection();
    
    // Sync database models
    await syncDatabase();
    
    // Verify email service
    await emailService.verifyConnection();
    
    // Clean up expired OTPs on startup
    await authService.cleanupExpiredOTPs();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Schedule periodic cleanup of expired OTPs
    setInterval(async () => {
      await authService.cleanupExpiredOTPs();
    }, 60 * 60 * 1000); // Every hour
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();