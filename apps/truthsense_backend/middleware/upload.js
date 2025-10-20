const multer = require('multer');
const path = require('path');

// Configure multer for audio file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check if file is audio
  const allowedTypes = (process.env.ALLOWED_AUDIO_TYPES || 'audio/wav,audio/webm,audio/mp3,audio/m4a').split(',');
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Parse MAX_FILE_SIZE from env (supports formats like "500MB" or "52428800")
const parseFileSize = (sizeStr) => {
  if (!sizeStr) return 50 * 1024 * 1024; // 50MB default

  const match = sizeStr.toString().match(/^(\d+)(MB|KB|GB)?$/i);
  if (!match) return 50 * 1024 * 1024;

  const value = parseInt(match[1]);
  const unit = (match[2] || '').toUpperCase();

  switch (unit) {
    case 'GB': return value * 1024 * 1024 * 1024;
    case 'MB': return value * 1024 * 1024;
    case 'KB': return value * 1024;
    default: return value; // Assume bytes if no unit
  }
};

const MAX_FILE_SIZE = parseFileSize(process.env.MAX_FILE_SIZE);
console.log(`📊 [Upload] Max file size configured: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)} MB (${MAX_FILE_SIZE} bytes)`);

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
      return res.status(400).json({
        success: false,
        error: `File too large. Maximum size allowed is ${maxSizeMB}MB.`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Only one file allowed.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  next();
};

module.exports = {
  upload,
  handleUploadError
};