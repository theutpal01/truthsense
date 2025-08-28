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
          required: ['eyeContact', 'shoulderAlignment', 'handGestures', 'headBodyAlignment'],
          properties: {
            eyeContact: {
              type: 'object',
              additionalProperties: {
                type: 'number'
              }
            },
            shoulderAlignment: {
              type: 'object',
              additionalProperties: {
                type: 'number'
              }
            },
            handGestures: {
              type: 'object',
              additionalProperties: {
                type: 'number'
              }
            },
            headBodyAlignment: {
              type: 'object',
              additionalProperties: {
                type: 'number'
              }
            }
          }
        },
        FluencyEvaluator: {
          type: 'object',
          required: ['comment', 'score'],
          properties: {
            comment: {
              type: 'string',
              description: '3-5 sentence feedback on fluency, including pace, fillers, pauses, flow.'
            },
            score: {
              type: 'integer',
              description: 'Fluency score (0-100).',
              minimum: 0,
              maximum: 100
            }
          }
        },
        ContentEvaluator: {
          type: 'object',
          required: ['strengths', 'improvements', 'structure_score', 'grammar_score'],
          properties: {
            strengths: {
              type: 'array',
              items: { type: 'string' },
              description: 'Strengths in content, structure, language, and grammar.',
              minItems: 2,
              maxItems: 5
            },
            improvements: {
              type: 'array',
              items: { type: 'string' },
              description: 'Suggestions for improvement in content, structure, language, grammar.',
              minItems: 2,
              maxItems: 5
            },
            structure_score: {
              type: 'integer',
              description: 'Score (0-100) for logical organization and transitions.',
              minimum: 0,
              maximum: 100
            },
            grammar_score: {
              type: 'integer',
              description: 'Score (0-100) for correctness of language use.',
              minimum: 0,
              maximum: 100
            }
          }
        },
        SpeechEvaluator: {
          type: 'object',
          required: ['strengths', 'improvements', 'clarity_score', 'confidence_score'],
          properties: {
            strengths: {
              type: 'array',
              items: { type: 'string' },
              description: 'Strengths in clarity, delivery, and perceived confidence.',
              minItems: 2,
              maxItems: 5
            },
            improvements: {
              type: 'array',
              items: { type: 'string' },
              description: 'Suggestions for improvement in clarity, delivery, perceived confidence.',
              minItems: 2,
              maxItems: 5
            },
            clarity_score: {
              type: 'integer',
              description: 'Score (0-100) for clarity of speech.',
              minimum: 0,
              maximum: 100
            },
            confidence_score: {
              type: 'integer',
              description: 'Score (0-100) for perceived speaker confidence.',
              minimum: 0,
              maximum: 100
            }
          }
        },
        PostureEvaluator: {
          type: 'object',
          required: ['tips', 'posture_score'],
          properties: {
            tips: {
              type: 'array',
              items: { type: 'string' },
              description: 'Pointers for improving posture while speaking',
              minItems: 3,
              maxItems: 7
            },
            posture_score: {
              type: 'integer',
              description: 'Score (0-100) for proper posture maintanence while speaking',
              minimum: 0,
              maximum: 100
            }
          }
        },
        AnalysisResult: {
          type: 'object',
          required: [
            'transcript',
            'overall_score',
            'speaking_rate',
            'fluency_evaluator',
            'language_evaluator',
            'speech_evaluator',
            'posture_evaluator'
          ],
          properties: {
            transcript: { type: 'string' },
            overall_score: { type: 'integer' },
            speaking_rate: { type: 'integer' },
            fluency_evaluator: {
              $ref: '#/components/schemas/FluencyEvaluator'
            },
            language_evaluator: {
              $ref: '#/components/schemas/ContentEvaluator'
            },
            speech_evaluator: {
              $ref: '#/components/schemas/SpeechEvaluator'
            },
            posture_evaluator: {
              $ref: '#/components/schemas/PostureEvaluator'
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