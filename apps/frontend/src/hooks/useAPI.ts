"use client";
import { useState, useEffect } from 'react';
import { authAPI, recordingAPI, healthAPI, type Recording, type RecordingDomain } from '../services/apiMethods';
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
	const {
		user,
		token,
		isLoading,
		login,
		logout,
		sendOTP,
		verifyOTP,
		error,
		setLoading,
		setUser,
		hasHydrated
	} = useAuthStore();

	useEffect(() => {
		if (!hasHydrated) return;

		const initAuth = async () => {
			if (!token) {
				logout(); // optional, in case token expired
				setLoading(false);
				return;
			}

			if (user) {
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				const res = await authAPI.getProfile();
				if (res.success && res.user) {
					setUser(res.user);
				} else {
					logout(); // fallback if user fetch fails
				}
			} catch (e: any) {
				if (e?.response?.status === 401) logout();
			} finally {
				setLoading(false);
			}
		};

		initAuth();
	}, [token, hasHydrated, user, setLoading, setUser, logout]);

	useEffect(() => {
		console.log("Auth status →", { isAuth: !!user, isLoading });
	}, [user, isLoading]);

	const isAuthenticated = !!user;

	return {
		user,
		token,
		isAuthenticated,
		isLoading: isLoading || !hasHydrated,
		login,
		error,
		sendOTP,
		verifyOTP,
		logout,
		hasHydrated,
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
