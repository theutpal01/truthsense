require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 8002;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    message: 'Welcome to TruthSense Backend API - Minimal Test',
    health: '/health'
  });
});

// Test recording domains endpoint (no auth needed)
app.get('/api/recordings/domains', (req, res) => {
  const domains = [
    { id: 'interview', label: 'Interview', isActive: true },
    { id: 'speech', label: 'Speech', isActive: true },
    { id: 'presentation', label: 'Presentation', isActive: true },
    { id: 'lecture', label: 'Lecture', isActive: true },
    { id: 'briefing', label: 'Briefing', isActive: true },
    { id: 'conference_talk', label: 'Conference Talk', isActive: true },
    { id: 'monologue', label: 'Monologue', isActive: true }
  ];
  
  res.json({
    success: true,
    domains
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Minimal test server is running on port ${PORT}`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📋 Domains: http://localhost:${PORT}/api/recordings/domains`);
});