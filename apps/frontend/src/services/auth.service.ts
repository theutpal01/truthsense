import { AuthResponse, LoginCredentials, OTPVerificationResponse, PasswordResetResponse, RegisterResponse, SignupCredentials, User } from "@/types/auth.types"
import { apiService } from "@/services/api.service"
import { STORAGE_KEYS, storageService } from "@/utils/storage.utils"
import { tokenManager } from "@/utils/token.utils"



class AuthService {
	private setAuthCookies(token: string, refreshToken?: string): void {
		if (typeof document !== 'undefined') {
			// Set multiple cookie formats for compatibility
			document.cookie = `auth_access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
			document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
			document.cookie = `isAuthenticated=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

			if (refreshToken) {
				document.cookie = `auth_refresh_token=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
				document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
			}
		}
	}

	private clearAuthCookies(): void {
		if (typeof document !== 'undefined') {
			const cookies = [
				'auth_access_token',
				'auth_refresh_token',
				'access_token',
				'refresh_token',
				'isAuthenticated'
			]
			cookies.forEach(name => {
				document.cookie = `${name}=; path=/; max-age=0`
			})
		}
	}
	// Login with email and password
	async login(credentials: LoginCredentials): Promise<AuthResponse> {
		const response = await apiService.post<AuthResponse>(
			'/auth/login/',
			credentials,
			false
		)

		tokenManager.setTokens(response.token, response.refreshToken)
		storageService.setJSON(STORAGE_KEYS.USER_DATA, response.user)
		this.setAuthCookies(response.token, response.refreshToken)

		return response
	}

	// Signup new user
	async signup(credentials: SignupCredentials): Promise<RegisterResponse> {
		const response = await apiService.post<RegisterResponse>(
			'/auth/signup/',
			credentials,
			false
		)
		return response;
	}

	// Send OTP to email
	async sendOTP(email: string): Promise<void> {
		await apiService.post('/auth/send-otp/', { email }, false)
	}

	// Verify OTP code
	async verifyOTP(email: string, code: string): Promise<OTPVerificationResponse> {
		const response = await apiService.post<OTPVerificationResponse>(
			'/auth/verify-otp/',
			{ email, code },
			false
		)

		if (response.success && response.token) {
			tokenManager.setTokens(response.token)
			this.setAuthCookies(response.token, response?.refreshToken)

			if (response.user) {
				storageService.setJSON(STORAGE_KEYS.USER_DATA, response.user)
			}
		}

		return response
	}

	// Forgot password api
	async requestPasswordReset(email: string): Promise<PasswordResetResponse> {
		const res = await apiService.post<PasswordResetResponse>('/auth/forgot-password/', { email }, false)
		if (res.success) {
			return res
		} else {
			throw new Error(res.error || 'Failed to request password reset')
		}
	}

	// Reset password
	async changePassword({ email, code, password }: { email: string; code: string; password: string }): Promise<PasswordResetResponse> {
		const res = await apiService.post<PasswordResetResponse>(
			'/auth/reset-password/',
			{ email, code, newPassword: password },
			false
		)
		if (!res.success) {
			throw new Error(res.error || 'Failed to reset password')
		}
		// Password reset successful
		return res;

	}


	// Get current user profile
	async getCurrentUser(): Promise<User> {
		const user = await apiService.get<User>('/auth/profile/', true);
		storageService.setJSON(STORAGE_KEYS.USER_DATA, user);
		return user;
	}

	// // Update user profile
	// async updateProfile(data: Partial<User>): Promise<User> {
	// 	const user = await apiService.patch<User>('/auth/profile/', data, true)
	// 	storageService.setJSON(STORAGE_KEYS.USER_DATA, user)
	// 	return user
	// }


	// Logout user
	async logout(): Promise<void> {
		try {
			const refreshToken = tokenManager.getRefreshToken()
			if (refreshToken) {
				await apiService.post('/auth/logout/', { refresh: refreshToken }, true)
			}
		} catch (error) {
			console.error('Logout API error:', error)
		} finally {
			tokenManager.clearTokens()
			storageService.clear()
			this.clearAuthCookies()
		}
	}

	// Check if user is authenticated
	isAuthenticated(): boolean {
		return tokenManager.hasValidToken()
	}

	// Get stored user data
	getStoredUser(): User | null {
		return storageService.getJSON<User>(STORAGE_KEYS.USER_DATA)
	}

	// Validate session
	async validateSession(): Promise<boolean> {
		if (!this.isAuthenticated()) {
			return false
		}

		try {
			await this.getCurrentUser()
			return true
		} catch (error) {
			this.logout()
			return false
		}
	}
}

export const authService = new AuthService()
