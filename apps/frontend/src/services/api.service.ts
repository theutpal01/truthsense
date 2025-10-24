import { ApiError } from "@/types/auth.types"
import { storageService } from "@/utils/storage.utils"
import { tokenManager } from "@/utils/token.utils"

class ApiService {
	private baseURL: string
	private isRefreshing = false
	private refreshPromise: Promise<string> | null = null

	constructor() {
		this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002/api'
	}

	private async refreshAccessToken(): Promise<string> {
		const refreshToken = tokenManager.getRefreshToken()

		if (!refreshToken) {
			throw new Error('No refresh token available')
		}

		try {
			const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refresh: refreshToken }),
			})

			if (!response.ok) {
				throw new Error('Token refresh failed')
			}

			const data = await response.json()
			tokenManager.setTokens(data.access, refreshToken)
			return data.access
		} catch (error) {
			tokenManager.clearTokens()
			storageService.clear()
			if (typeof window !== "undefined") {
				window.location.href = '/login'
			}
			throw error
		}
	}

	private async getValidAccessToken(): Promise<string> {
		const accessToken = tokenManager.getAccessToken()

		if (!accessToken) {
			throw new Error('No access token available')
		}

		// Check if token is expiring soon
		if (tokenManager.isTokenExpiringSoon(accessToken)) {
			if (!this.isRefreshing) {
				this.isRefreshing = true
				this.refreshPromise = this.refreshAccessToken()
			}

			const newToken = await this.refreshPromise!
			this.isRefreshing = false
			this.refreshPromise = null
			return newToken
		}

		return accessToken
	}

	async request<T>(
		endpoint: string,
		options: RequestInit = {},
		requiresAuth = true
	): Promise<T> {
		const url = `${this.baseURL}${endpoint}`
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...(options.headers as Record<string, string> || {}),
		}

		if (requiresAuth) {
			try {
				const accessToken = await this.getValidAccessToken()
				headers['Authorization'] = `Bearer ${accessToken}`
			} catch {
				throw new Error('Authentication required')
			}
		}

		try {
			const response = await fetch(url, { ...options, headers })

			if (!response.ok) {
				if (response.status === 401 && requiresAuth) {
					// Try to refresh token and retry once
					try {
						const newAccessToken = await this.refreshAccessToken()
						const retryResponse = await fetch(url, {
							...options,
							headers: {
								...headers,
								Authorization: `Bearer ${newAccessToken}`,
							},
						})

						if (!retryResponse.ok) {
							throw await this.handleErrorResponse(retryResponse)
						}

						return await retryResponse.json()
					} catch (refreshError) {
						throw refreshError
					}
				}

				throw await this.handleErrorResponse(response)
			}

			// Handle 204 No Content
			if (response.status === 204) {
				return {} as T
			}

			return await response.json()
		} catch (err) {
			throw err
		}
	}

	private async handleErrorResponse(response: Response): Promise<ApiError> {
		try {
			const errorData = await response.json()
			return {
				message: errorData.error || errorData.detail || `HTTP error! status: ${response.status}`,
				statusCode: response.status,
				errors: errorData.errors,
			}
		} catch {
			return {
				message: `HTTP error! status: ${response.status}`,
				statusCode: response.status,
			}
		}
	}

	async get<T>(endpoint: string, requiresAuth = true): Promise<T> {
		return this.request<T>(endpoint, { method: 'GET' }, requiresAuth)
	}

	async post<T>(endpoint: string, data?: any, requiresAuth = true): Promise<T> {
		return this.request<T>(
			endpoint,
			{
				method: 'POST',
				body: data ? JSON.stringify(data) : undefined,
			},
			requiresAuth
		)
	}

	async put<T>(endpoint: string, data?: any, requiresAuth = true): Promise<T> {
		return this.request<T>(
			endpoint,
			{
				method: 'PUT',
				body: data ? JSON.stringify(data) : undefined,
			},
			requiresAuth
		)
	}

	async patch<T>(endpoint: string, data?: any, requiresAuth = true): Promise<T> {
		return this.request<T>(
			endpoint,
			{
				method: 'PATCH',
				body: data ? JSON.stringify(data) : undefined,
			},
			requiresAuth
		)
	}

	async delete<T>(endpoint: string, requiresAuth = true): Promise<T> {
		return this.request<T>(endpoint, { method: 'DELETE' }, requiresAuth)
	}

	async uploadFile<T>(
		endpoint: string,
		formData: FormData,
		requiresAuth = true
	): Promise<T> {
		const url = `${this.baseURL}${endpoint}`
		const headers: HeadersInit = {}

		if (requiresAuth) {
			try {
				const accessToken = await this.getValidAccessToken()
				headers.Authorization = `Bearer ${accessToken}`
			} catch{
				throw new Error('Authentication required')
			}
		}
		console.log("Uploading file to:", url);
		console.log("Uploading file with data:")
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers,
				body: formData,
			})

			console.log("Upload response status:", response.status);

			if (!response.ok) {
				if (response.status === 401 && requiresAuth) {
					// Try to refresh token and retry once
					try {
						const newAccessToken = await this.refreshAccessToken()
						const retryResponse = await fetch(url, {
							method: 'POST',
							headers: {
								...headers,
								Authorization: `Bearer ${newAccessToken}`,
							},
							body: formData,
						})

						if (!retryResponse.ok) {
							throw await this.handleErrorResponse(retryResponse)
						}

						return await retryResponse.json()
					} catch (refreshError) {
						throw refreshError
					}
				}

				throw await this.handleErrorResponse(response)
			}

			return await response.json()
		} catch (error) {
			throw error
		}
	}

}

export const apiService = new ApiService()
