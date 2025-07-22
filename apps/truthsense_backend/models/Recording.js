const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Recording = sequelize.define('Recording', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  domain: {
    type: DataTypes.ENUM('interview', 'speech', 'presentation', 'lecture', 'briefing', 'conference_talk', 'monologue'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('idle', 'recording', 'completed', 'processing', 'processed', 'failed'),
    defaultValue: 'idle'
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Duration in seconds'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  audioFileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  audioFilePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  audioFileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'File size in bytes'
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  postureFeatures: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object containing posture analysis from frontend'
  },
  analysisResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'AI analysis result to be sent to frontend'
  },
  processingStartedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'recordings',
  timestamps: true
});

module.exports = Recording;