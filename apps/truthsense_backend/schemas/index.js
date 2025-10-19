const Joi = require('joi');

// Schema for posture features coming from frontend
const PostureFeatures = Joi.object().unknown(true);

// Schema for response to frontend
const FrontendResponse = Joi.object({
  recordingId: Joi.string().uuid().required(),
  status: Joi.string().valid('processing', 'processed', 'failed').required(),
  analysis: Joi.when('status', {
    is: 'processed',
    then: Joi.object({
      overall: Joi.object({
        score: Joi.number().min(0).max(100).required(),
        grade: Joi.string().valid('A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F').required(),
        summary: Joi.string().required()
      }).required(),
      speechAnalysis: Joi.object({
        clarity: Joi.number().min(0).max(100).required(),
        pace: Joi.number().min(0).max(100).required(),
        volume: Joi.number().min(0).max(100).required(),
        fillerWords: Joi.number().required(),
        pauseAnalysis: Joi.object({
          appropriatePauses: Joi.number().required(),
          inappropriatePauses: Joi.number().required()
        }).required()
      }).required(),
      postureAnalysis: Joi.object({
        posture: Joi.number().min(0).max(100).required(),
        eyeContact: Joi.number().min(0).max(100).required(),
        gestures: Joi.number().min(0).max(100).required(),
        confidence: Joi.number().min(0).max(100).required()
      }).required(),
      recommendations: Joi.array().items(
        Joi.object({
          category: Joi.string().required(),
          issue: Joi.string().required(),
          suggestion: Joi.string().required(),
          priority: Joi.string().valid('high', 'medium', 'low').required()
        })
      ).required(),
      timestamps: Joi.object({
        goodMoments: Joi.array().items(
          Joi.object({
            start: Joi.number().required(),
            end: Joi.number().required(),
            reason: Joi.string().required()
          })
        ).required(),
        improvementAreas: Joi.array().items(
          Joi.object({
            start: Joi.number().required(),
            end: Joi.number().required(),
            issue: Joi.string().required()
          })
        ).required()
      }).required()
    }).required(),
    otherwise: Joi.forbidden()
  }),
  error: Joi.when('status', {
    is: 'failed',
    then: Joi.string().required(),
    otherwise: Joi.forbidden()
  }),
  processedAt: Joi.when('status', {
    is: 'processed',
    then: Joi.date().iso().required(),
    otherwise: Joi.forbidden()
  })
});

// Authentication schemas
const SignupRequest = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const LoginRequest = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

const ForgotPasswordRequest = Joi.object({
  email: Joi.string().email().required()
});

const ResetPasswordRequest = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  newPassword: Joi.string().min(8).required()
});

const VerifyOTPRequest = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required()
});

// Legacy OTP-only login (keeping for backward compatibility)
const OTPLoginRequest = Joi.object({
  email: Joi.string().email().required()
});

// Recording schemas
const StartRecordingRequest = Joi.object({
  domain: Joi.string().valid('interview', 'speech', 'presentation', 'lecture', 'briefing', 'conference_talk', 'monologue').required()
});

const UploadRecordingRequest = Joi.object({
  recordingId: Joi.string().uuid().required(),
  postureFeatures: PostureFeatures.required()
});

module.exports = {
  PostureFeatures,
  FrontendResponse,
  SignupRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyOTPRequest,
  OTPLoginRequest,
  StartRecordingRequest,
  UploadRecordingRequest
};