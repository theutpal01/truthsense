// API configuration and base setup
// window not defined

const API_BASE_URL =
	typeof window !== 'undefined' && window.location.hostname === 'localhost'
		? 'http://localhost:8002'
		: 'https://api.truthsense.com';

class ApiService {
	private baseURL: string;
	private token: string | null = null;

	constructor() {
		this.baseURL = API_BASE_URL;
		// Load token from localStorage if available
		if (typeof window !== 'undefined') {
			this.token = localStorage.getItem('token');
		}
	}

	// Set authentication token
	setToken(token: string) {
		this.token = token;
		if (typeof window !== 'undefined') {
			localStorage.setItem('token', token);
		}
	}

	// Clear authentication token
	clearToken() {
		this.token = null;
		if (typeof window !== 'undefined') {
			localStorage.removeItem('token');
		}
	}

	// Get headers with authentication
	private getHeaders(): HeadersInit {
		const headers: HeadersInit = {
			'Content-Type': 'application/json',
		};

		if (this.token) {
			headers['Authorization'] = `Bearer ${this.token}`;
		}

		return headers;
	}

	// Generic API request method
	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const url = `${this.baseURL}${endpoint}`;

		const config: RequestInit = {
			...options,
			headers: {
				...this.getHeaders(),
				...options.headers,
			},
		};

		try {
			const response = await fetch(url, config);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Network error' }));
				throw new Error(errorData.error || `HTTP ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('API request failed:', error);
			throw error;
		}
	}

	// GET request
	async get<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: 'GET' });
	}

	// POST request
	async post<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	// PUT request
	async put<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: data ? JSON.stringify(data) : undefined,
		});
	}

	// DELETE request
	async delete<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: 'DELETE' });
	}

	// File upload method
	async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<T> {
		const formData = new FormData();
		formData.append('audioFile', file);

		if (additionalData) {
			Object.entries(additionalData).forEach(([key, value]) => {
				formData.append(key, value);
			});
		}

		const headers: HeadersInit = {};
		if (this.token) {
			headers['Authorization'] = `Bearer ${this.token}`;
		}

		const response = await fetch(`${this.baseURL}${endpoint}`, {
			method: 'POST',
			headers,
			body: formData,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
			throw new Error(errorData.error || `HTTP ${response.status}`);
		}

		return await response.json();
	}
}

// Create singleton instance
export const apiService = new ApiService();
export default apiService;
