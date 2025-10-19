const recordingService = require('../services/recordingService');
const aiProcessingService = require('../services/aiProcessingService');
const { StartRecordingRequest, UploadRecordingRequest, PostureFeatures } = require('../schemas');

class RecordingController {
  async getRecordingDomains(req, res) {
    try {
      console.log('🎯 [Controller] Getting recording domains');
      const domains = recordingService.getRecordingDomains();
      console.log(`✅ [Controller] Found ${domains.length} domains`);

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
      console.log(`🎯 [Controller] Creating recording for user: ${req.user.id}`);
      console.log(`📝 [Controller] Request body:`, req.body);

      // Validate request
      const { error, value } = StartRecordingRequest.validate(req.body);
      if (error) {
        console.log(`❌ [Controller] Validation failed: ${error.details[0].message}`);
        return res.status(400).json({
          success: false,
          error: error.details[0].message
        });
      }

      const { domain } = value;
      console.log(`🎤 [Controller] Domain: ${domain}`);
      const result = await recordingService.createRecording(req.user.id, domain);

      if (!result.success) {
        console.log(`❌ [Controller] Failed to create recording:`, result.error);
        return res.status(400).json(result);
      }

      console.log(`✅ [Controller] Recording created successfully: ${result.recording.id}`);
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
      console.log(`▶️  [Controller] Starting recording: ${recordingId} for user: ${req.user.id}`);

      const result = await recordingService.startRecording(recordingId, req.user.id);

      if (!result.success) {
        console.log(`❌ [Controller] Failed to start recording:`, result.error);
        return res.status(400).json(result);
      }

      console.log(`✅ [Controller] Recording started successfully`);
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
      console.log(`⏹️  [Controller] Stopping recording: ${recordingId} for user: ${req.user.id}`);

      const result = await recordingService.stopRecording(recordingId, req.user.id);

      if (!result.success) {
        console.log(`❌ [Controller] Failed to stop recording:`, result.error);
        return res.status(400).json(result);
      }

      console.log(`✅ [Controller] Recording stopped successfully`);
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
      console.log(`📤 [Controller] Uploading recording: ${recordingId} for user: ${req.user.id}`);

      // Check if audio file is uploaded
      if (!req.file) {
        console.log(`❌ [Controller] No audio file in request`);
        return res.status(400).json({
          success: false,
          error: 'Audio file is required'
        });
      }

      console.log(`📁 [Controller] File details:`, {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`
      });

      // Validate posture features
      let postureFeatures;
      try {
        postureFeatures = JSON.parse(req.body.postureFeatures || '{}');
        console.log(`🧍 [Controller] Posture features parsed successfully`);
      } catch (parseError) {
        console.log(`❌ [Controller] Failed to parse posture features:`, parseError);
        return res.status(400).json({
          success: false,
          error: 'Invalid posture features JSON'
        });
      }

      const { error } = PostureFeatures.validate(postureFeatures);
      if (error) {
        console.log(`❌ [Controller] Posture features validation failed:`, error.details[0].message);
        return res.status(400).json({
          success: false,
          error: `Posture features validation error: ${error.details[0].message}`
        });
      }

      console.log(`✅ [Controller] Validation passed, saving audio file...`);

      // Save audio file and posture features
      const result = await recordingService.saveAudioFile(
        recordingId,
        req.user.id,
        req.file,
        postureFeatures
      );

      if (!result.success) {
        console.log(`❌ [Controller] Failed to save audio:`, result.error);
        return res.status(400).json(result);
      }

      console.log(`✅ [Controller] Audio saved, queuing AI processing...`);

      // Queue AI processing job
      await aiProcessingService.queueProcessing(recordingId);

      console.log(`✅ [Controller] Upload complete, processing queued`);

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
      console.log(`🔍 [Controller] Getting recording: ${recordingId} for user: ${req.user.id}`);

      const result = await recordingService.getRecording(recordingId, req.user.id);

      if (!result.success) {
        console.log(`❌ [Controller] Recording not found:`, result.error);
        return res.status(404).json(result);
      }

      console.log(`📊 [Controller] Recording status: ${result.recording.status}`);

      // Format response based on status
      let response = {
        success: true,
        recordingId: result.recording.id,
        status: result.recording.status
      };

      if (result.recording.status === 'processed' && result.recording.analysisResult) {
        console.log(`✅ [Controller] Analysis available, sending response`);
        response.analysis = result.recording.analysisResult;
        response.processedAt = result.recording.processedAt;

        // Ensure info fields are present in the analysis
        if (response.analysis && !response.analysis.info) {
          response.analysis.info = {
            category: result.recording.domain || 'general',
            reportCreated: result.recording.processedAt || new Date().toISOString()
          };
        }
      } else if (result.recording.status === 'failed') {
        console.log(`❌ [Controller] Recording processing failed: ${result.recording.errorMessage}`);
        response.error = result.recording.errorMessage || 'Processing failed';
      } else {
        console.log(`⏳ [Controller] Recording still in status: ${result.recording.status}`);
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