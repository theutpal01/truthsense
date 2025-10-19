const authService = require('../services/authService');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log(`🔒 [Auth] No token provided for ${req.method} ${req.url}`);
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    console.log(`🔑 [Auth] Verifying token for ${req.method} ${req.url}`);
    const decoded = authService.verifyToken(token);
    console.log(`✅ [Auth] Token decoded, userId: ${decoded.userId}`);

    const user = await authService.getUserById(decoded.userId);

    if (!user) {
      console.log(`❌ [Auth] User not found: ${decoded.userId}`);
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log(`✅ [Auth] User authenticated: ${user.id} (${user.email})`);
    req.user = user;
    next();
  } catch (error) {
    console.log(`❌ [Auth] Authentication failed: ${error.message}`);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

module.exports = { authenticateToken };