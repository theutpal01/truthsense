const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TruthSense API',
      version: '1.0.0',
      description: 'API for TruthSense speech and posture analysis platform',
      contact: {
        name: 'TruthSense Support',
        email: 'support@truthsense.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.truthsense.com' 
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            }
          }
        },
        PostureFeatures: {
          type: 'object',
          required: ['headPosition', 'shoulderAlignment', 'spineAlignment', 'eyeContact', 'gestures', 'confidence'],
          properties: {
            headPosition: {
              type: 'object',
              required: ['x', 'y', 'z'],
              properties: {
                x: { type: 'number' },
                y: { type: 'number' },
                z: { type: 'number' }
              }
            },
            shoulderAlignment: {
              type: 'object',
              required: ['leftShoulder', 'rightShoulder'],
              properties: {
                leftShoulder: {
                  type: 'object',
                  required: ['x', 'y'],
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' }
                  }
                },
                rightShoulder: {
                  type: 'object',
                  required: ['x', 'y'],
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' }
                  }
                }
              }
            },
            spineAlignment: {
              type: 'number'
            },
            eyeContact: {
              type: 'object',
              required: ['percentage', 'avgDuration'],
              properties: {
                percentage: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100
                },
                avgDuration: {
                  type: 'number'
                }
              }
            },
            gestures: {
              type: 'object',
              required: ['handMovements', 'facialExpressions'],
              properties: {
                handMovements: { type: 'number' },
                facialExpressions: { type: 'number' }
              }
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1
            }
          }
        },
        AnalysisResult: {
          type: 'object',
          properties: {
            overall: {
              type: 'object',
              properties: {
                score: {
                  type: 'number',
                  minimum: 0,
                  maximum: 100
                },
                grade: {
                  type: 'string',
                  enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F']
                },
                summary: {
                  type: 'string'
                }
              }
            },
            speechAnalysis: {
              type: 'object',
              properties: {
                clarity: { type: 'number', minimum: 0, maximum: 100 },
                pace: { type: 'number', minimum: 0, maximum: 100 },
                volume: { type: 'number', minimum: 0, maximum: 100 },
                fillerWords: { type: 'number' },
                pauseAnalysis: {
                  type: 'object',
                  properties: {
                    appropriatePauses: { type: 'number' },
                    inappropriatePauses: { type: 'number' }
                  }
                }
              }
            },
            postureAnalysis: {
              type: 'object',
              properties: {
                posture: { type: 'number', minimum: 0, maximum: 100 },
                eyeContact: { type: 'number', minimum: 0, maximum: 100 },
                gestures: { type: 'number', minimum: 0, maximum: 100 },
                confidence: { type: 'number', minimum: 0, maximum: 100 }
              }
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  issue: { type: 'string' },
                  suggestion: { type: 'string' },
                  priority: { 
                    type: 'string',
                    enum: ['high', 'medium', 'low']
                  }
                }
              }
            },
            timestamps: {
              type: 'object',
              properties: {
                goodMoments: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      start: { type: 'number' },
                      end: { type: 'number' },
                      reason: { type: 'string' }
                    }
                  }
                },
                improvementAreas: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      start: { type: 'number' },
                      end: { type: 'number' },
                      issue: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Email OTP authentication endpoints'
      },
      {
        name: 'Recordings',
        description: 'Recording management and analysis endpoints'
      }
    ]
  },
  apis: ['./routes/*.js'], // Path to the API files
};

const specs = swaggerJsdoc(options);

module.exports = specs;