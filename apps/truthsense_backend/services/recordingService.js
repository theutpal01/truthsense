const { Recording } = require('../models');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

class RecordingService {
  constructor() {
    this.recordingDomains = [
      { id: 'interview', label: 'Interview', isActive: true },
      { id: 'speech', label: 'Speech', isActive: true },
      { id: 'presentation', label: 'Presentation', isActive: true },
      { id: 'lecture', label: 'Lecture', isActive: true },
      { id: 'briefing', label: 'Briefing', isActive: true },
      { id: 'conference_talk', label: 'Conference Talk', isActive: true },
      { id: 'monologue', label: 'Monologue', isActive: true }
    ];
  }

  getRecordingDomains() {
    return this.recordingDomains;
  }

  async createRecording(userId, domain) {
    try {
      const recording = await Recording.create({
        userId,
        domain,
        status: 'idle',
        startTime: new Date()
      });

      return {
        success: true,
        recording: {
          id: recording.id,
          domain: recording.domain,
          status: recording.status,
          startTime: recording.startTime
        }
      };
    } catch (error) {
      console.error('❌ Create recording error:', error);
      return { success: false, error: error.message };
    }
  }

  async startRecording(recordingId, userId) {
    try {
      const recording = await Recording.findOne({
        where: { id: recordingId, userId }
      });

      if (!recording) {
        return { success: false, error: 'Recording not found' };
      }

      if (recording.status !== 'idle') {
        return { success: false, error: 'Recording already started or completed' };
      }

      await recording.update({
        status: 'recording',
        startTime: new Date()
      });

      return {
        success: true,
        recording: {
          id: recording.id,
          status: recording.status,
          startTime: recording.startTime
        }
      };
    } catch (error) {
      console.error('❌ Start recording error:', error);
      return { success: false, error: error.message };
    }
  }

  async stopRecording(recordingId, userId) {
    try {
      const recording = await Recording.findOne({
        where: { id: recordingId, userId }
      });

      if (!recording) {
        return { success: false, error: 'Recording not found' };
      }

      if (recording.status !== 'recording') {
        return { success: false, error: 'Recording is not in progress' };
      }

      const endTime = new Date();
      const duration = Math.floor((endTime - recording.startTime) / 1000);

      await recording.update({
        status: 'completed',
        endTime,
        duration
      });

      return {
        success: true,
        recording: {
          id: recording.id,
          status: recording.status,
          duration,
          endTime
        }
      };
    } catch (error) {
      console.error('❌ Stop recording error:', error);
      return { success: false, error: error.message };
    }
  }

  async saveAudioFile(recordingId, userId, audioFile, postureFeatures) {
    try {
      const recording = await Recording.findOne({
        where: { id: recordingId, userId }
      });

      if (!recording) {
        return { success: false, error: 'Recording not found' };
      }

      if (recording.status !== 'completed') {
        return { success: false, error: 'Recording must be completed first' };
      }

      // Generate unique filename
      const fileName = `${recordingId}_${Date.now()}${path.extname(audioFile.originalname)}`;
      const filePath = path.join(process.cwd(), 'media', 'audio', fileName);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Save file
      await fs.writeFile(filePath, audioFile.buffer);

      // Update recording with file info and posture features
      await recording.update({
        audioFileName: fileName,
        audioFilePath: filePath,
        audioFileSize: audioFile.size,
        mimeType: audioFile.mimetype,
        postureFeatures,
        status: 'processing',
        processingStartedAt: new Date()
      });

      return {
        success: true,
        recording: {
          id: recording.id,
          status: recording.status,
          audioFileName: fileName
        }
      };
    } catch (error) {
      console.error('❌ Save audio file error:', error);
      return { success: false, error: error.message };
    }
  }

  async getRecording(recordingId, userId) {
    try {
      const recording = await Recording.findOne({
        where: { id: recordingId, userId },
        attributes: ['id', 'domain', 'status', 'duration', 'startTime', 'endTime', 'analysisResult', 'processedAt', 'errorMessage']
      });

      if (!recording) {
        return { success: false, error: 'Recording not found' };
      }

      return { success: true, recording };
    } catch (error) {
      console.error('❌ Get recording error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserRecordings(userId, limit = 10, offset = 0) {
    try {
      const recordings = await Recording.findAndCountAll({
        where: { userId },
        attributes: ['id', 'domain', 'status', 'duration', 'startTime', 'endTime', 'createdAt'],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return {
        success: true,
        recordings: recordings.rows,
        total: recordings.count
      };
    } catch (error) {
      console.error('❌ Get user recordings error:', error);
      return { success: false, error: error.message };
    }
  }

  async updateRecordingStatus(recordingId, status, analysisResult = null, errorMessage = null) {
    try {
      const updateData = { status };
      
      if (status === 'processed') {
        updateData.analysisResult = analysisResult;
        updateData.processedAt = new Date();
      } else if (status === 'failed') {
        updateData.errorMessage = errorMessage;
      }

      await Recording.update(updateData, {
        where: { id: recordingId }
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Update recording status error:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteRecording(recordingId, userId) {
    try {
      const recording = await Recording.findOne({
        where: { id: recordingId, userId }
      });

      if (!recording) {
        return { success: false, error: 'Recording not found' };
      }

      // Delete audio file if exists
      if (recording.audioFilePath) {
        try {
          await fs.unlink(recording.audioFilePath);
        } catch (fileError) {
          console.warn('⚠️ Could not delete audio file:', fileError.message);
        }
      }

      await recording.destroy();

      return { success: true, message: 'Recording deleted successfully' };
    } catch (error) {
      console.error('❌ Delete recording error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new RecordingService();