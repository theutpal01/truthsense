const rateLimit = require('express-rate-limit');

// Rate limiter for OTP requests
const otpLimiter = rateLimit({
  windowMs: (process.env.OTP_RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.OTP_RATE_LIMIT_MAX || 5, // 5 requests per window
  message: {
    success: false,
    error: 'Too many OTP requests. Please try again later.',
    retryAfter: Math.ceil((process.env.OTP_RATE_LIMIT_WINDOW || 15) * 60)
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    error: 'Too many login attempts. Please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    error: 'Upload limit exceeded. Please try again later.',
    retryAfter: 3600
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  otpLimiter,
  loginLimiter,
  apiLimiter,
  uploadLimiter
};