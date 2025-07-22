const recordingService = require('../services/recordingService');
const aiProcessingService = require('../services/aiProcessingService');
const { StartRecordingRequest, UploadRecordingRequest, PostureFeatures } = require('../schemas');

class RecordingController {
  async getRecordingDomains(req, res) {
    try {
      const domains = recordingService.getRecordingDomains();
      
      res.json({
        success: true,
        domains
      });
    } catch (error) {
      console.error('❌ Get recording domains error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async createRecording(req, res) {
    try {
      // Validate request
      const { error, value } = StartRecordingRequest.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { domain } = value;
      const result = await recordingService.createRecording(req.user.id, domain);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('❌ Create recording error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async startRecording(req, res) {
    try {
      const { recordingId } = req.params;
      const result = await recordingService.startRecording(recordingId, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('❌ Start recording error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async stopRecording(req, res) {
    try {
      const { recordingId } = req.params;
      const result = await recordingService.stopRecording(recordingId, req.user.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('❌ Stop recording error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async uploadRecording(req, res) {
    try {
      const { recordingId } = req.params;

      // Check if audio file is uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Audio file is required'
        });
      }

      // Validate posture features
      let postureFeatures;
      try {
        postureFeatures = JSON.parse(req.body.postureFeatures || '{}');
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid posture features JSON'
        });
      }

      const { error } = PostureFeatures.validate(postureFeatures);
      if (error) {
        return res.status(400).json({
          success: false,
          error: `Posture features validation error: ${error.details[0].message}`
        });
      }

      // Save audio file and posture features
      const result = await recordingService.saveAudioFile(
        recordingId,
        req.user.id,
        req.file,
        postureFeatures
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Queue AI processing job
      await aiProcessingService.queueProcessing(recordingId);

      res.json({
        success: true,
        message: 'Recording uploaded successfully. Processing has started.',
        recording: result.recording
      });
    } catch (error) {
      console.error('❌ Upload recording error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getRecording(req, res) {
    try {
      const { recordingId } = req.params;
      const result = await recordingService.getRecording(recordingId, req.user.id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      // Format response based on status
      let response = {
        success: true,
        recordingId: result.recording.id,
        status: result.recording.status
      };

      if (result.recording.status === 'processed' && result.recording.analysisResult) {
        response.analysis = result.recording.analysisResult;
        response.processedAt = result.recording.processedAt;
      } else if (result.recording.status === 'failed') {
        response.error = result.recording.errorMessage || 'Processing failed';
      }

      res.json(response);
    } catch (error) {
      console.error('❌ Get recording error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getUserRecordings(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      const result = await recordingService.getUserRecordings(req.user.id, limit, offset);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('❌ Get user recordings error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async deleteRecording(req, res) {
    try {
      const { recordingId } = req.params;
      const result = await recordingService.deleteRecording(recordingId, req.user.id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('❌ Delete recording error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async retryRecording(req, res) {
    try {
      const { recordingId } = req.params;
      
      // Reset recording to idle state
      await recordingService.updateRecordingStatus(recordingId, 'idle');
      
      res.json({
        success: true,
        message: 'Recording reset successfully. You can start recording again.'
      });
    } catch (error) {
      console.error('❌ Retry recording error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new RecordingController();