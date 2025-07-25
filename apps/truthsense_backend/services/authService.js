const jwt = require('jsonwebtoken');
const { User, OTP } = require('../models');
const emailService = require('./emailService');
require('dotenv').config();

class AuthService {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async sendOTP(email) {
    try {
      // Invalidate previous OTPs for this email
      await OTP.update(
        { isUsed: true },
        { where: { email, isUsed: false } }
      );

      // Generate new OTP
    //   const code = this.generateOTP();
	  const code = "000000";
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save OTP to database
      await OTP.create({
        email,
        code,
        expiresAt
      });

      // Send email
      const emailResult = await emailService.sendOTP(email, code);
      
      if (!emailResult.success) {
        throw new Error('Failed to send OTP email');
      }

      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      return { success: false, error: error.message };
    }
  }

  async verifyOTP(email, code) {
    try {
      // Find valid OTP
      const otpRecord = await OTP.findOne({
        where: {
          email,
          code,
          isUsed: false,
          expiresAt: {
            [require('sequelize').Op.gt]: new Date()
          }
        }
      });

      if (!otpRecord) {
        // Increment attempts for all OTPs for this email
        await OTP.increment('attempts', {
          where: { email, isUsed: false }
        });
        return { success: false, error: 'Invalid or expired OTP' };
      }

      // Mark OTP as used
      await OTP.update(
        { isUsed: true },
        { where: { id: otpRecord.id } }
      );

      // Find or create user
      let user = await User.findOne({ where: { email } });
      
      if (!user) {
        user = await User.create({
          email,
          isVerified: true,
          lastLoginAt: new Date()
        });
      } else {
        await user.update({
          isVerified: true,
          lastLoginAt: new Date()
        });
      }

      // Generate JWT token
      const token = this.generateToken(user.id);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.createdAt
        }
      };
    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'isVerified', 'lastLoginAt', 'createdAt']
      });
      return user;
    } catch (error) {
      console.error('❌ Get user error:', error);
      return null;
    }
  }

  async cleanupExpiredOTPs() {
    try {
      await OTP.destroy({
        where: {
          expiresAt: {
            [require('sequelize').Op.lt]: new Date()
          }
        }
      });
      console.log('✅ Expired OTPs cleaned up');
    } catch (error) {
      console.error('❌ OTP cleanup error:', error);
    }
  }
}

module.exports = new AuthService();