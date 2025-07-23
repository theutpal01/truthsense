import { apiService } from './api';

// Types for API responses
export interface AuthResponse {
  success: boolean;
  message: string;
  email?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    isVerified: boolean;
    lastLoginAt?: string;
  };
}

export interface RecordingDomain {
  id: string;
  label: string;
  isActive: boolean;
}

export interface Recording {
  id: string;
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
  postureFeatures?: Record<string, unknown>;
  analysisResult?: Record<string, unknown>;
  processingStartedAt?: string;
  processedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
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
  analysis?: Record<string, unknown>;
  recordingId?: string;
  status: 'idle' | 'recording' | 'completed' | 'processing' | 'processed' | 'failed';
}

// Authentication API methods
export const authAPI = {
  // Send OTP to email
  async sendOTP(email: string): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/api/auth/send-otp', { email });
  },

  // Verify OTP and login
  async verifyOTP(email: string, code: string): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/auth/verify-otp', { 
      email, 
      code 
    });
    
    // Store token if login successful
    if (response.success && response.token) {
      apiService.setToken(response.token);
    }
    
    return response;
  },

  // Get user profile
  async getProfile(): Promise<AuthResponse> {
    return apiService.get<AuthResponse>('/api/auth/profile');
  },

  // Refresh token
  async refreshToken(): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/api/auth/refresh');
    
    if (response.success && response.token) {
      apiService.setToken(response.token);
    }
    
    return response;
  },

  // Logout
  logout() {
    apiService.clearToken();
  }
};

// Recording API methods
export const recordingAPI = {
  // Get available recording domains
  async getDomains(): Promise<{ success: boolean; domains: RecordingDomain[] }> {
    return apiService.get<{ success: boolean; domains: RecordingDomain[] }>('/api/recordings/domains');
  },

  // Create new recording
  async createRecording(domain: string): Promise<RecordingResponse> {
    return apiService.post<RecordingResponse>('/api/recordings', { domain });
  },

  // Start recording
  async startRecording(recordingId: string): Promise<RecordingResponse> {
    return apiService.post<RecordingResponse>(`/api/recordings/${recordingId}/start`);
  },

  // Stop recording
  async stopRecording(recordingId: string): Promise<RecordingResponse> {
    return apiService.post<RecordingResponse>(`/api/recordings/${recordingId}/stop`);
  },

  // Upload audio file
  async uploadAudio(recordingId: string, audioFile: File, postureFeatures?: unknown): Promise<RecordingResponse> {
    const additionalData: Record<string, string> = {};
    
    if (postureFeatures) {
      additionalData.postureFeatures = JSON.stringify(postureFeatures);
    }
    
    return apiService.uploadFile<RecordingResponse>(
      `/api/recordings/${recordingId}/upload`,
      audioFile,
      additionalData
    );
  },

  // Get recording details
  async getRecording(recordingId: string): Promise<RecordingAnalysis> {
    return apiService.get<RecordingAnalysis>(`/api/recordings/${recordingId}`);
  },

  // Get user recordings
  async getUserRecordings(): Promise<RecordingResponse> {
    return apiService.get<RecordingResponse>('/api/recordings');
  },

  // Retry failed recording
  async retryRecording(recordingId: string): Promise<RecordingResponse> {
    return apiService.post<RecordingResponse>(`/api/recordings/${recordingId}/retry`);
  },

  // Delete recording
  async deleteRecording(recordingId: string): Promise<RecordingResponse> {
    return apiService.delete<RecordingResponse>(`/api/recordings/${recordingId}`);
  }
};

// Health check
export const healthAPI = {
  async checkHealth(): Promise<{ status: string; timestamp: string; version: string; environment: string }> {
    return apiService.get<{ status: string; timestamp: string; version: string; environment: string }>('/health');
  }
};
