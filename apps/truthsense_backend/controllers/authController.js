const authService = require('../services/authService');
const { LoginRequest, VerifyOTPRequest } = require('../schemas');

class AuthController {
  async sendOTP(req, res) {
    try {
      // Validate request
      const { error, value } = LoginRequest.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { email } = value;
      const result = await authService.sendOTP(email);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'OTP sent successfully',
        email
      });
    } catch (error) {
      console.error('❌ Send OTP controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async verifyOTP(req, res) {
    try {
      // Validate request
      const { error, value } = VerifyOTPRequest.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { email, code } = value;
      const result = await authService.verifyOTP(email, code);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'Login successful',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      console.error('❌ Verify OTP controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        user: req.user
      });
    } catch (error) {
      console.error('❌ Get profile controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const newToken = authService.generateToken(req.user.id);
      
      res.json({
        success: true,
        token: newToken
      });
    } catch (error) {
      console.error('❌ Refresh token controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();