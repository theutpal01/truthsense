const Queue = require('bull');
const recordingService = require('./recordingService');
const { Recording } = require('../models');

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

			try {
				// Get recording data
				const recording = await Recording.findByPk(recordingId);
				if (!recording) {
					throw new Error('Recording not found');
				}

				// Simulate AI processing (replace with actual AI service call)
				const analysisResult = await this.performAIAnalysis(recording);

				// Update recording with results
				await recordingService.updateRecordingStatus(
					recordingId,
					'processed',
					analysisResult
				);

				console.log(`✅ Successfully processed recording: ${recordingId}`);
				return analysisResult;
			} catch (error) {
				console.error(`❌ Failed to process recording ${recordingId}:`, error);

				// Update recording with error
				await recordingService.updateRecordingStatus(
					recordingId,
					'failed',
					null,
					error.message
				);

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
			const job = await this.processingQueue.add('analyze-recording', {
				recordingId
			}, {
				delay: 1000 // Small delay to ensure database consistency
			});

			console.log(`📋 Queued processing job ${job.id} for recording ${recordingId}`);
			return { success: true, jobId: job.id };
		} catch (error) {
			console.error('❌ Failed to queue processing job:', error);
			return { success: false, error: error.message };
		}
	}

	async performAIAnalysis(recording) {
		// This is a mock AI analysis function
		// In production, this would call your actual AI service

		console.log(`🤖 Starting AI analysis for recording ${recording.id}`);
		console.log(`📁 Audio file: ${recording.audioFileName}`);
		console.log(`📊 Posture features available: ${!!recording.postureFeatures}`);

		// Simulate processing time
		await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 10000));

		// Mock analysis based on domain and posture features
		const domain = recording.domain;
		const postureFeatures = recording.postureFeatures || {};

		// Generate mock analysis result
		const analysisResult = {
			overall: {
				score: Math.floor(70 + Math.random() * 25), // Random score between 70-95
				grade: this.calculateGrade(Math.floor(70 + Math.random() * 25)),
				summary: this.generateSummary(domain)
			},
			speechAnalysis: {
				clarity: Math.floor(75 + Math.random() * 20),
				pace: Math.floor(70 + Math.random() * 25),
				volume: Math.floor(80 + Math.random() * 15),
				fillerWords: Math.floor(Math.random() * 10),
				pauseAnalysis: {
					appropriatePauses: Math.floor(5 + Math.random() * 10),
					inappropriatePauses: Math.floor(Math.random() * 5)
				}
			},
			postureAnalysis: {
				posture: Math.floor(70 + Math.random() * 25),
				eyeContact: postureFeatures.eyeContact ?
					Math.floor(postureFeatures.eyeContact.percentage * 0.8 + Math.random() * 20) :
					Math.floor(60 + Math.random() * 30),
				gestures: Math.floor(65 + Math.random() * 30),
				confidence: Math.floor((postureFeatures.confidence || 0.7) * 100)
			},
			recommendations: this.generateRecommendations(domain),
			timestamps: {
				goodMoments: [
					{ start: 15, end: 45, reason: "Excellent eye contact and clear articulation" },
					{ start: 120, end: 180, reason: "Strong posture and confident gestures" }
				],
				improvementAreas: [
					{ start: 60, end: 90, issue: "Speaking pace too fast" },
					{ start: 200, end: 220, issue: "Fidgeting detected" }
				]
			}
		};

		console.log(`✅ AI analysis completed for recording ${recording.id}`);
		return analysisResult;
	}

	calculateGrade(score) {
		if (score >= 95) return 'A+';
		if (score >= 90) return 'A';
		if (score >= 85) return 'B+';
		if (score >= 80) return 'B';
		if (score >= 75) return 'C+';
		if (score >= 70) return 'C';
		if (score >= 65) return 'D+';
		if (score >= 60) return 'D';
		return 'F';
	}

	generateSummary(domain) {
		const summaries = {
			interview: "Good overall performance with room for improvement in confidence and eye contact.",
			speech: "Strong delivery with clear articulation. Work on reducing filler words.",
			presentation: "Professional presentation style. Consider varying your pace for better engagement.",
			lecture: "Informative delivery with good structure. Enhance gestures for better student engagement.",
			briefing: "Clear and concise communication. Maintain consistent eye contact with audience.",
			conference_talk: "Engaging presentation with good technical content delivery.",
			monologue: "Natural speaking style with good emotional expression."
		};

		return summaries[domain] || "Good overall performance with areas for improvement identified.";
	}

	generateRecommendations(domain) {
		const baseRecommendations = [
			{
				category: "Speech",
				issue: "Pace variation needed",
				suggestion: "Try to vary your speaking pace to maintain audience engagement",
				priority: "medium"
			},
			{
				category: "Posture",
				issue: "Maintain eye contact",
				suggestion: "Look directly at your audience more frequently to build connection",
				priority: "high"
			},
			{
				category: "Gestures",
				issue: "Use purposeful hand movements",
				suggestion: "Incorporate deliberate gestures to emphasize key points",
				priority: "low"
			}
		];

		return baseRecommendations;
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