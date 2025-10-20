// Request logging middleware

const logRequest = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;

  // Log incoming request
  console.log('\n' + '='.repeat(80));
  console.log(`📥 [${timestamp}] ${method} ${url}`);
  console.log(`🌐 IP: ${ip}`);
  console.log(`👤 User: ${req.user ? req.user.id : 'Not authenticated'}`);

  // Log headers (excluding sensitive ones)
  const safeHeaders = { ...req.headers };
  if (safeHeaders.authorization) {
    safeHeaders.authorization = 'Bearer [REDACTED]';
  }
  console.log(`📋 Headers:`, JSON.stringify(safeHeaders, null, 2));

  // Log query parameters
  if (Object.keys(req.query).length > 0) {
    console.log(`🔍 Query Params:`, JSON.stringify(req.query, null, 2));
  }

  // Log body (excluding sensitive fields)
  if (req.body && Object.keys(req.body).length > 0) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[REDACTED]';
    if (safeBody.code) safeBody.code = '[REDACTED]';
    console.log(`📦 Body:`, JSON.stringify(safeBody, null, 2));
  }

  // Log file uploads
  if (req.file) {
    console.log(`📁 File Upload:`, {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`,
      buffer: `${req.file.buffer?.length || 0} bytes`
    });
  }

  // Capture start time
  req.startTime = Date.now();

  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - req.startTime;

    console.log(`📤 Response Status: ${res.statusCode}`);
    console.log(`⏱️  Duration: ${duration}ms`);

    // Log response body (truncate if too large)
    try {
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      const responseStr = JSON.stringify(responseData, null, 2);

      if (responseStr.length > 1000) {
        console.log(`📄 Response (truncated):`, responseStr.substring(0, 1000) + '...');
      } else {
        console.log(`📄 Response:`, responseStr);
      }
    } catch (e) {
      console.log(`📄 Response: [Unable to parse]`);
    }

    console.log('='.repeat(80) + '\n');

    originalSend.call(this, data);
  };

  next();
};

module.exports = { logRequest };
