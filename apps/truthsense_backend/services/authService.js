const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, OTP } = require('../models');
const emailService = require('./emailService');
require('dotenv').config();

class AuthService {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
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
      const code = this.generateOTP();
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

  async signup(name, email, password) {
    try {
      const existingUser = await User.findOne({ where: { email } });

      // If user exists and is verified, return error
      if (existingUser && existingUser.isVerified) {
        return { success: false, error: 'User already exists and is verified. Please login instead.' };
      }

      const hashedPassword = await this.hashPassword(password);

      // If user exists but not verified, update their info and resend OTP
      if (existingUser && !existingUser.isVerified) {
        await existingUser.update({
          name,
          password: hashedPassword
        });

        const result = await this.sendOTP(email);
        if (!result.success) {
          return { success: false, error: 'Failed to send verification OTP' };
        }

        return {
          success: true,
          message: 'Account updated. Please verify your email with the OTP sent.',
          userId: existingUser.id
        };
      }

      // Create new user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        isVerified: false
      });

      const result = await this.sendOTP(email);
      if (!result.success) {
        await user.destroy();
        return { success: false, error: 'Failed to send verification OTP' };
      }

      return {
        success: true,
        message: 'User created successfully. Please verify your email with the OTP sent.',
        userId: user.id
      };
    } catch (error) {
      console.error('❌ Signup error:', error);
      return { success: false, error: error.message };
    }
  }

  async login(email, password) {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user || !user.password) {
        return { success: false, error: 'Invalid email or password' };
      }

      const isPasswordValid = await this.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      if (!user.isVerified) {
        return { success: false, error: 'Please verify your email first' };
      }

      await user.update({ lastLoginAt: new Date() });

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
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async forgotPassword(email) {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return { success: false, error: 'Email not found' };
      }

      const result = await this.sendOTP(email);
      if (!result.success) {
        return { success: false, error: 'Failed to send reset OTP' };
      }

      return { 
        success: true, 
        message: 'Password reset OTP sent to your email'
      };
    } catch (error) {
      console.error('❌ Forgot password error:', error);
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email, code, newPassword) {
    try {
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
        await OTP.increment('attempts', {
          where: { email, isUsed: false }
        });
        return { success: false, error: 'Invalid or expired OTP' };
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      await OTP.update(
        { isUsed: true },
        { where: { id: otpRecord.id } }
      );

      const hashedPassword = await this.hashPassword(newPassword);
      await user.update({ password: hashedPassword });

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      console.error('❌ Reset password error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AuthService();