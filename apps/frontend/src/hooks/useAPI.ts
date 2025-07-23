import { useState, useEffect } from 'react';
import { authAPI, recordingAPI, healthAPI, type AuthResponse, type Recording, type RecordingDomain } from '../services/apiMethods';

// Authentication hook
export const useAuth = () => {
	const [user, setUser] = useState<AuthResponse['user'] | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Send OTP
	const sendOTP = async (email: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await authAPI.sendOTP(email);
			return response;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// Verify OTP and login
	const verifyOTP = async (email: string, code: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await authAPI.verifyOTP(email, code);
			if (response.success && response.user) {
				setUser(response.user);
			}
			return response;
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to verify OTP';
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// Logout
	const logout = () => {
		authAPI.logout();
		setUser(null);
	};

	// Check if user is logged in on mount
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const response = await authAPI.getProfile();
				if (response.success && response.user) {
					setUser(response.user);
				}
			} catch {
				// User is not authenticated
				authAPI.logout();
			}
		};

		checkAuth();
	}, []);

	return {
		user,
		isLoading,
		error,
		sendOTP,
		verifyOTP,
		logout,
		isAuthenticated: !!user
	};
};

// Recording domains hook
export const useRecordingDomains = () => {
	const [domains, setDomains] = useState<RecordingDomain[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDomains = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await recordingAPI.getDomains();
				if (response.success) {
					setDomains(response.domains);
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to fetch domains';
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		fetchDomains();
	}, []);

	return { domains, isLoading, error };
};

// Recording management hook
export const useRecording = () => {
	const [recordings, setRecordings] = useState<Recording[]>([]);
	const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Create new recording
	const createRecording = async (domain: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await recordingAPI.createRecording(domain);
			if (response.success && response.recording) {
				setCurrentRecording(response.recording);
				return response.recording;
			}
			throw new Error(response.message || 'Failed to create recording');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to create recording';
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// Start recording
	const startRecording = async (recordingId: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await recordingAPI.startRecording(recordingId);
			if (response.success && response.recording) {
				setCurrentRecording(response.recording);
				return response.recording;
			}
			throw new Error(response.message || 'Failed to start recording');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// Stop recording
	const stopRecording = async (recordingId: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await recordingAPI.stopRecording(recordingId);
			if (response.success && response.recording) {
				setCurrentRecording(response.recording);
				return response.recording;
			}
			throw new Error(response.message || 'Failed to stop recording');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// Upload audio
	const uploadAudio = async (recordingId: string, audioFile: File, postureFeatures?: unknown) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await recordingAPI.uploadAudio(recordingId, audioFile, postureFeatures);
			if (response.success && response.recording) {
				setCurrentRecording(response.recording);
				return response.recording;
			}
			throw new Error(response.message || 'Failed to upload audio');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to upload audio';
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	// Get user recordings
	const fetchRecordings = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await recordingAPI.getUserRecordings();
			if (response.success && response.recordings) {
				setRecordings(response.recordings);
				return response.recordings;
			}
			throw new Error(response.message || 'Failed to fetch recordings');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recordings';
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	const fetchRecordingAnalysis = async (recordingId: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await recordingAPI.getRecording(recordingId);
			if (response.success && response.status === 'processed') {
				return response.analysis;
			}
			throw new Error(response.message || 'Failed to fetch recording analysis');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recording analysis';
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}


	};

	const deleteRecording = async (recordingId: string) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await recordingAPI.deleteRecording(recordingId);
			if (response.success) {
				setRecordings((prev) => prev.filter((rec) => rec.id !== recordingId));
				if (currentRecording?.id === recordingId) {
					setCurrentRecording(null);
				}
				return true;
			}
			throw new Error(response.message || 'Failed to delete recording');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to delete recording';
			setError(errorMessage);
			throw err;
		} finally {
			setIsLoading(false);
		}
	};


	return {
		recordings,
		currentRecording,
		isLoading,
		error,
		createRecording,
		startRecording,
		stopRecording,
		uploadAudio,
		fetchRecordings,
		fetchRecordingAnalysis,
		deleteRecording,
		setCurrentRecording
	};
};

// Health check hook
export const useHealthCheck = () => {
	const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
	const [healthData, setHealthData] = useState<object | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const checkHealth = async () => {
		setIsLoading(true);
		try {
			const response = await healthAPI.checkHealth();
			setIsHealthy(response.status === 'OK');
			setHealthData(response);
		} catch {
			setIsHealthy(false);
			setHealthData(null);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		checkHealth();
	}, []);

	return { isHealthy, healthData, isLoading, checkHealth };
};
