const Queue = require('bull');
const recordingService = require('./recordingService');
const { Recording, sequelize } = require('../models');
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

class AIProcessingService {
	constructor() {
		// Create a Redis-backed queue for AI processing jobs
		this.processingQueue = new Queue('AI Processing', process.env.REDIS_URL || 'redis://localhost:6379', {
			defaultJobOptions: {
				removeOnComplete: 10,
				removeOnFail: 5,
				attempts: 3,
				backoff: {
					type: 'exponential',
					delay: 2000
				}
			}
		});

		this.setupProcessing();
	}

	setupProcessing() {
		// Process AI analysis jobs
		this.processingQueue.process('analyze-recording', async (job) => {
			const { recordingId } = job.data;
			console.log(`🔄 Processing recording: ${recordingId}`);

			const transaction = await sequelize.transaction();
			
			try {
				// Get recording data within transaction
				const recording = await Recording.findByPk(recordingId, { transaction });
				if (!recording) {
					throw new Error('Recording not found');
				}

				// Update status to processing within transaction
				await recording.update({
					status: 'processing',
					processingStartedAt: new Date()
				}, { transaction });

				// Commit the processing start status
				await transaction.commit();

				// Perform AI analysis (outside transaction as it's long-running)
				const analysisResult = await this.performAIAnalysis(recording);

				// Create new transaction for final update
				const finalTransaction = await sequelize.transaction();

				try {
					// Update recording with results within transaction
					await recording.update({
						status: 'processed',
						analysisResult: analysisResult,
						processedAt: new Date()
					}, { transaction: finalTransaction });

					await finalTransaction.commit();
					console.log(`✅ Successfully processed recording: ${recordingId}`);
					return analysisResult;

				} catch (updateError) {
					await finalTransaction.rollback();
					throw updateError;
				}

			} catch (error) {
				// Rollback transaction if still active
				if (!transaction.finished) {
					await transaction.rollback();
				}

				console.error(`❌ Failed to process recording ${recordingId}:`, error);

				// Create separate transaction for error update
				const errorTransaction = await sequelize.transaction();
				try {
					const recording = await Recording.findByPk(recordingId, { transaction: errorTransaction });
					if (recording) {
						await recording.update({
							status: 'failed',
							errorMessage: error.message
						}, { transaction: errorTransaction });
					}
					await errorTransaction.commit();
				} catch (errorUpdateError) {
					await errorTransaction.rollback();
					console.error(`❌ Failed to update error status for ${recordingId}:`, errorUpdateError);
				}

				throw error;
			}
		});

		// Event listeners for job status
		this.processingQueue.on('completed', (job, result) => {
			console.log(`✅ Job ${job.id} completed successfully`);
		});

		this.processingQueue.on('failed', (job, err) => {
			console.error(`❌ Job ${job.id} failed:`, err.message);
		});

		this.processingQueue.on('stalled', (job) => {
			console.warn(`⚠️ Job ${job.id} stalled`);
		});
	}

	async queueProcessing(recordingId) {
		try {
			console.log(`🚀 [AI Service] Queueing processing for recording: ${recordingId}`);
			const job = await this.processingQueue.add('analyze-recording', {
				recordingId
			}, {
				delay: 1000 // Small delay to ensure database consistency
			});

			console.log(`✅ [AI Service] Queued processing job ${job.id} for recording ${recordingId}`);
			return { success: true, jobId: job.id };
		} catch (error) {
			console.error(`❌ [AI Service] Failed to queue processing job for ${recordingId}:`, error);
			return { success: false, error: error.message };
		}
	}

	async performAIAnalysis(recording) {
		console.log(`🤖 Starting AI analysis for recording ${recording.id}`);
		console.log(`📁 Audio file: ${recording.audioFileName}`);
		console.log(`📊 Posture features available: ${!!recording.postureFeatures}`);

		try {
			// Call the Python AI service
			const analysisResult = await this.callAIService(recording);
			console.log(`✅ AI analysis completed for recording ${recording.id}`);
			return analysisResult;
		} catch (error) {
			console.error(`❌ AI analysis failed for recording ${recording.id}:`, error);
			throw error;
		}
	}

	async callAIService(recording) {
		const AI_SERVICE_URL = process.env.AI_SERVICE_URL;
		const maxRetries = 3;
		const retryDelay = 5000; // 5 seconds

		console.log(`🌐 [AI Service] AI Service URL: ${AI_SERVICE_URL}`);

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				console.log(`📡 [AI Service] Calling AI service (attempt ${attempt}/${maxRetries})...`);

				// Prepare form data
				const formData = new FormData();
				formData.append('recording_id', recording.id);
				formData.append('domain', recording.domain);
				formData.append('posture_features', JSON.stringify(recording.postureFeatures || {}));

				console.log(`📦 [AI Service] Form data prepared:`, {
					recording_id: recording.id,
					domain: recording.domain,
					has_posture_features: !!recording.postureFeatures
				});

				// Read and append audio file
				if (!recording.audioFilePath || !fs.existsSync(recording.audioFilePath)) {
					throw new Error(`Audio file not found: ${recording.audioFilePath}`);
				}

				console.log(`📁 [AI Service] Reading audio file: ${recording.audioFilePath}`);
				const audioStream = fs.createReadStream(recording.audioFilePath);
				formData.append('audio_file', audioStream, {
					filename: recording.audioFileName,
					contentType: recording.mimeType || 'audio/wav'
				});

				// Make request to AI service
				console.log(`🚀 [AI Service] Sending request to ${AI_SERVICE_URL}/analyze`);
				const response = await fetch(`${AI_SERVICE_URL}/analyze`, {
					method: 'POST',
					body: formData,
					timeout: 30000, // 30 second timeout for initial request
					headers: formData.getHeaders()
				});

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`AI service returned ${response.status}: ${errorText}`);
				}

				const result = await response.json();
				
				if (!result.success) {
					throw new Error(`AI service error: ${result.error}`);
				}

				// Poll for completion
				const analysisResult = await this.pollForCompletion(recording.id, AI_SERVICE_URL);
				return analysisResult;

			} catch (error) {
				console.error(`❌ AI service call failed (attempt ${attempt}):`, error.message);
				
				if (attempt === maxRetries) {
					throw new Error(`AI service failed after ${maxRetries} attempts: ${error.message}`);
				}

				// Wait before retry
				console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
				await new Promise(resolve => setTimeout(resolve, retryDelay));
			}
		}
	}

	async pollForCompletion(recordingId, aiServiceUrl, maxPollTime = 600000) { // 10 minutes max
		const pollInterval = 5000; // Poll every 5 seconds
		const startTime = Date.now();

		console.log(`📊 Polling for completion of recording ${recordingId}...`);

		while (Date.now() - startTime < maxPollTime) {
			try {
				const response = await fetch(`${aiServiceUrl}/status/${recordingId}`, {
					timeout: 10000 // 10 second timeout for status checks
				});

				if (!response.ok) {
					throw new Error(`Status check failed: ${response.status}`);
				}

				const status = await response.json();
				console.log(`📈 Progress: ${status.progress}% - ${status.message}`);

				if (status.status === 'completed') {
					// Clean up the job on the AI service
					try {
						await fetch(`${aiServiceUrl}/jobs/${recordingId}`, { method: 'DELETE' });
					} catch (cleanupError) {
						console.warn(`⚠️ Failed to cleanup job ${recordingId}:`, cleanupError.message);
					}

					return status.analysis;
				} else if (status.status === 'failed') {
					throw new Error(`AI analysis failed: ${status.error || 'Unknown error'}`);
				}

				// Wait before next poll
				await new Promise(resolve => setTimeout(resolve, pollInterval));

			} catch (error) {
				console.error(`❌ Error polling status for ${recordingId}:`, error.message);
				throw error;
			}
		}

		throw new Error(`AI analysis timed out after ${maxPollTime}ms`);
	}


	async getJobStatus(jobId) {
		try {
			const job = await this.processingQueue.getJob(jobId);
			if (!job) {
				return { success: false, error: 'Job not found' };
			}

			return {
				success: true,
				status: await job.getState(),
				progress: job.progress(),
				data: job.data
			};
		} catch (error) {
			console.error('❌ Get job status error:', error);
			return { success: false, error: error.message };
		}
	}

	async getQueueStats() {
		try {
			const waiting = await this.processingQueue.getWaiting();
			const active = await this.processingQueue.getActive();
			const completed = await this.processingQueue.getCompleted();
			const failed = await this.processingQueue.getFailed();

			return {
				waiting: waiting.length,
				active: active.length,
				completed: completed.length,
				failed: failed.length
			};
		} catch (error) {
			console.error('❌ Get queue stats error:', error);
			return null;
		}
	}
}

module.exports = new AIProcessingService();