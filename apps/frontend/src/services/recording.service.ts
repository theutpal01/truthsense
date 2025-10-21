import { apiService } from './api.service'
import type {
	Recording,
	RecordingDomain,
	RecordingResponse,
	RecordingAnalysis,
	DomainsResponse,
	CreateRecordingPayload,
	UploadAudioPayload,
	RecordingFilters,
	AnalysisResult,
} from '@/types/recording.types'

class RecordingService {
	private readonly BASE_PATH = '/recordings'

	// Get available recording domains
	async getDomains(): Promise<RecordingDomain[]> {
		const response = await apiService.get<DomainsResponse>(`${this.BASE_PATH}/domains`, true)
		return response.domains
	}

	// Create new recording
	async createRecording(payload: CreateRecordingPayload): Promise<Recording> {
		const response = await apiService.post<RecordingResponse>(
			this.BASE_PATH,
			payload,
			true
		)

		if (!response.success || !response.recording) {
			throw new Error(response.message || 'Failed to create recording')
		}

		return response.recording
	}

	// Start recording
	async startRecording(recordingId: string): Promise<Recording> {
		const response = await apiService.post<RecordingResponse>(
			`${this.BASE_PATH}/${recordingId}/start`,
			undefined,
			true
		)

		if (!response.success || !response.recording) {
			throw new Error(response.message || 'Failed to start recording')
		}

		return response.recording
	}

	// Stop recording
	async stopRecording(recordingId: string): Promise<Recording> {
		const response = await apiService.post<RecordingResponse>(
			`${this.BASE_PATH}/${recordingId}/stop`,
			undefined,
			true
		)

		if (!response.success || !response.recording) {
			throw new Error(response.message || 'Failed to stop recording')
		}

		return response.recording
	}

	// Upload audio file with posture features
	async uploadAudio(
		recordingId: string,
		payload: UploadAudioPayload
	): Promise<Recording> {
		console.log("Payload received for uploadAudio:", payload);
		const formData = new FormData()
		formData.append('audioFile', payload.audioFile)

		if (payload.postureFeatures) {
			formData.append('postureFeatures', JSON.stringify(payload.postureFeatures))
		}

		if (payload.publicId) {
			formData.append('publicId', payload.publicId);
		}

		if (payload.secureUrl) {
			formData.append('secureUrl', payload.secureUrl);
		}

		if (payload.videoFileSize) {
			formData.append('videoFileSize', payload.videoFileSize.toString());
		}

		console.log("Uploading posture features: ", formData);
		const response = await apiService.uploadFile<RecordingResponse>(
			`${this.BASE_PATH}/${recordingId}/upload`,
			formData,
			true
		)
		console.log("Uploading posture features: ", "Uploaded in server");

		if (!response.success || !response.recording) {
			throw new Error(response.message || 'Failed to upload audio')
		}

		return response.recording
	}

	// Get single recording details with analysis
	async getRecording(recordingId: string): Promise<RecordingAnalysis> {
		const response = await apiService.get<RecordingAnalysis>(
			`${this.BASE_PATH}/${recordingId}`,
			true
		)

		if (!response.success) {
			throw new Error(response.message || 'Failed to fetch recording')
		}

		return response
	}

	// Get user recordings with optional filters
	async getUserRecordings(filters?: RecordingFilters): Promise<Recording[]> {
		const queryParams = new URLSearchParams()

		if (filters) {
			Object.entries(filters).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					queryParams.append(key, String(value))
				}
			})
		}

		const query = queryParams.toString()
		const endpoint = query ? `${this.BASE_PATH}?${query}` : this.BASE_PATH

		const response = await apiService.get<RecordingResponse>(endpoint, true)

		if (!response.success || !response.recordings) {
			throw new Error(response.message || 'Failed to fetch recordings')
		}

		return response.recordings
	}

	// Retry failed recording processing
	async retryRecording(recordingId: string): Promise<Recording> {
		const response = await apiService.post<RecordingResponse>(
			`${this.BASE_PATH}/${recordingId}/retry`,
			undefined,
			true
		)

		if (!response.success || !response.recording) {
			throw new Error(response.message || 'Failed to retry recording')
		}

		return response.recording
	}

	// Delete recording
	async deleteRecording(recordingId: string): Promise<void> {
		const response = await apiService.delete<RecordingResponse>(
			`${this.BASE_PATH}/${recordingId}`,
			true
		)

		if (!response.success) {
			throw new Error(response.message || 'Failed to delete recording')
		}
	}

	// Get recording analysis details
	async getAnalysis(recordingId: string): Promise<AnalysisResult> {
		const response = await apiService.get<{ success: boolean; analysis: AnalysisResult }>(
			`${this.BASE_PATH}/${recordingId}/analysis`,
			true
		)

		if (!response.success || !response.analysis) {
			throw new Error('Failed to fetch analysis')
		}

		return response.analysis
	}

	// Poll recording status (useful for processing status)
	async pollRecordingStatus(
		recordingId: string,
		interval: number = 2000,
		maxAttempts: number = 30
	): Promise<Recording> {
		let attempts = 0

		return new Promise((resolve, reject) => {
			const poll = setInterval(async () => {
				try {
					attempts++

					const response = await this.getRecording(recordingId)

					if (response.status === 'processed' || response.status === 'failed') {
						clearInterval(poll)

						if (response.status === 'failed') {
							reject(new Error('Recording processing failed'))
						} else {
							// Fetch full recording details
							const recordings = await this.getUserRecordings()
							const recording = recordings.find(r => r.id === recordingId)

							if (recording) {
								resolve(recording)
							} else {
								reject(new Error('Recording not found'))
							}
						}
					}

					if (attempts >= maxAttempts) {
						clearInterval(poll)
						reject(new Error('Polling timeout'))
					}
				} catch (error) {
					clearInterval(poll)
					reject(error)
				}
			}, interval)
		})
	}
}

export const recordingService = new RecordingService()
