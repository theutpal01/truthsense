const authService = require('../services/authService');
const { SignupRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest, VerifyOTPRequest, OTPLoginRequest } = require('../schemas');

class AuthController {
  async sendOTP(req, res) {
    try {
      // Validate request
      const { error, value } = OTPLoginRequest.validate(req.body);
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

  async signup(req, res) {
    try {
      const { error, value } = SignupRequest.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { name, email, password } = value;
      const result = await authService.signup(name, email, password);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json({
        success: true,
        message: result.message,
        userId: result.userId
      });
    } catch (error) {
      console.error('❌ Signup controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async login(req, res) {
    try {
      const { error, value } = LoginRequest.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { email, password } = value;
      const result = await authService.login(email, password);

      if (!result.success) {
        return res.status(401).json(result);
      }

      res.json({
        success: true,
        message: 'Login successful',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      console.error('❌ Login controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { error, value } = ForgotPasswordRequest.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { email } = value;
      const result = await authService.forgotPassword(email);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('❌ Forgot password controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { error, value } = ResetPasswordRequest.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { email, code, newPassword } = value;
      const result = await authService.resetPassword(email, code, newPassword);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('❌ Reset password controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();