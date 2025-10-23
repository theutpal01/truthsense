import { User } from "./auth.types"
import { FeedbackCounts } from "./feedback.types";

export interface RecordingDomain {
	id: string;
	label: string;
	isActive: boolean;
	description?: string;
	icon?: string;
}

export interface Recording {
	id: string;
	publicId: string;
	userId: string;
	domain: string;
	status: 'idle' | 'recording' | 'completed' | 'processing' | 'processed' | 'failed';
	duration: number;
	startTime?: string;
	endTime?: string;
	audioFileName?: string;
	audioFilePath?: string;
	audioFileSize?: number;
	mimeType?: string;
	postureFeatures?: PostureFeatures;
	analysisResult?: AnalysisResult;
	processingStartedAt?: string;
	processedAt?: string;
	errorMessage?: string;
	createdAt: string;
	updatedAt: string;
}

export interface PostureFeatures {
	shoulderAlignment?: number;
	spineAngle?: number;
	headTilt?: number;
	confidence?: number;
	timestamp?: string;
	[key: string]: unknown;
}

export interface AnalysisResult {
	overallScore?: number;
	confidence?: number;
	feedback?: string;
	metrics?: AnalysisMetrics;
	suggestions?: string[];
	[key: string]: unknown;
}

export interface AnalysisMetrics {
	clarity?: number;
	pace?: number;
	tone?: number;
	fluency?: number;
	[key: string]: unknown;
}

export interface RecordingResponse {
	success: boolean;
	recording?: Recording;
	recordings?: Recording[];
	message?: string;
}

export interface RecordingAnalysis {
	success: boolean;
	message?: string;
	analysis?: AnalysisResult;
	recordingId?: string;
	status: 'idle' | 'recording' | 'completed' | 'processing' | 'processed' | 'failed';
}

export interface DomainsResponse {
	success: boolean;
	domains: RecordingDomain[];
}

export interface CreateRecordingPayload {
	domain: string;
}

export interface UploadAudioPayload {
	audioFile: File;
	postureFeatures?: FeedbackCounts;
	secureUrl?: string;
	publicId?: string;
	videoFileSize?: number;
}

export interface RecordingFilters {
	status?: Recording['status'];
	domain?: string;
	startDate?: string;
	endDate?: string;
	limit?: number;
	offset?: number;
}

export interface RecordingStats {
	totalRecordings: number;
	completedRecordings: number;
	processingRecordings: number;
	failedRecordings: number;
	totalDuration: number;
	averageScore?: number;
}


export interface UploadOptions {
	fileBuffer: Buffer;
	filename: string;
	recordingId: string;
	user: User;
}

export interface CloudinaryUploadResponse {
	secure_url: string;
	public_id: string;
	resource_type: string;
	format: string;
	bytes: number;
	duration: number;
	url: string;
	created_at: string;
}

export interface VideoMetadata {
	userId: string;
	userEmail: string;
	recordingId: string;
	uploadDate: string;
}