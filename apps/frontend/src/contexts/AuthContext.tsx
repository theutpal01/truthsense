"use client"

import { authService } from "@/services/auth.service"
import { LoginCredentials, SignupCredentials, User } from "@/types/auth.types"
import { tokenManager } from "@/utils/token.utils"
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react"

interface AuthContextType {
	user: User | null
	token: string | null
	isLoading: boolean
	error: string | null
	isHydrated: boolean

	// Auth methods
	login: (credentials: LoginCredentials) => Promise<void>
	signup: (credentials: SignupCredentials) => Promise<void>
	logout: () => Promise<void>

	// OTP methods
	sendOTP: (email: string) => Promise<void>
	verifyOTP: (email: string, code: string) => Promise<{ success: boolean }>
	resendOTP: (email: string) => Promise<void>

	// Profile methods
	updateProfile: (data: Partial<User>) => Promise<void>
	refreshUser: () => Promise<void>

	// Password methods
	changePassword: (oldPassword: string, newPassword: string) => Promise<void>
	requestPasswordReset: (email: string) => Promise<void>
	confirmPasswordReset: (token: string, newPassword: string) => Promise<void>

	// Email verification
	verifyEmail: (token: string) => Promise<void>
	resendEmailVerification: () => Promise<void>

	// Error handling
	setError: (error: string | null) => void
	clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null)
	const [token, setToken] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [isHydrated, setIsHydrated] = useState(false)

	// Initialize auth state from localStorage (hydration)
	useEffect(() => {
		const initializeAuth = () => {
			const storedToken = tokenManager.getAccessToken()
			const storedUser = authService.getStoredUser()

			if (storedToken && !tokenManager.isTokenExpired(storedToken)) {
				setToken(storedToken)
				setUser(storedUser)

				if (typeof document !== 'undefined') {
					document.cookie = `auth_access_token=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
					document.cookie = `access_token=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
					document.cookie = `isAuthenticated=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
				}
			} else {
				// Clear invalid/expired data
				authService.logout()
			}

			setIsHydrated(true)
		}

		initializeAuth()
	}, [])

	// Login with email and password
	const login = useCallback(async (credentials: LoginCredentials) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await authService.login(credentials);
			setToken(response.token);
			setUser(response.user);

		} catch (err: any) {
			if (err.statusCode === 401 && err.message === "Please verify your email first") {
				console.error('Login error auth:', err);
				throw { isVerified: false, message: "Please verify your email first" };
			}

			const errorMessage = err?.message || 'Login failed';
			setError(errorMessage)
			throw { message: errorMessage, isVerified: true };
		} finally {
			setIsLoading(false)
		}
	}, [])


	// Signup new user
	const signup = useCallback(async (credentials: SignupCredentials) => {
		setIsLoading(true)
		setError(null)

		try {
			await authService.signup(credentials)
		} catch (err: any) {
			const errorMessage = err?.message || err?.err || 'Signup failed'
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Logout
	const logout = useCallback(async () => {
		setIsLoading(true)

		try {
			await authService.logout()
		} catch (err) {
			console.error('Logout error:', err)
		} finally {
			setUser(null)
			setToken(null)
			setError(null)
			setIsLoading(false)
		}
	}, [])

	// Send OTP
	const sendOTP = useCallback(async (email: string) => {
		setIsLoading(true)
		setError(null)

		try {
			await authService.sendOTP(email)
		} catch (err: any) {
			const errorMessage = err?.message || 'Failed to send OTP'
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Verify OTP
	const verifyOTP = useCallback(async (email: string, code: string) => {
		setIsLoading(true)
		setError(null)

		try {
			const response = await authService.verifyOTP(email, code)

			if (response.success && response.token) {
				setToken(response.token)
				if (response.user) {
					setUser(response.user)
				}
			}

			return { success: response.success }
		} catch (err: any) {
			const errorMessage = err?.message || 'Failed to verify OTP'
			setError(errorMessage)
			return { success: false }
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Resend OTP
	const resendOTP = useCallback(async (email: string) => {
		setIsLoading(true)
		setError(null)

		try {
			await authService.resendOTP(email)
		} catch (err: any) {
			const errorMessage = err?.message || 'Failed to resend OTP'
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Update user profile
	const updateProfile = useCallback(async (data: Partial<User>) => {
		setIsLoading(true)
		setError(null)

		try {
			const updatedUser = await authService.updateProfile(data)
			setUser(updatedUser)
		} catch (err: any) {
			const errorMessage = err?.message || 'Failed to update profile'
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Refresh user data
	const refreshUser = useCallback(async () => {
		try {
			const userData = await authService.getCurrentUser()
			setUser(userData)
		} catch (err) {
			console.error('Failed to refresh user:', err)
		}
	}, [])

	// Change password
	const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
		setIsLoading(true)
		setError(null)

		try {
			await authService.changePassword(oldPassword, newPassword)
		} catch (err: any) {
			const errorMessage = err?.message || 'Failed to change password'
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Request password reset
	const requestPasswordReset = useCallback(async (email: string) => {
		setIsLoading(true)
		setError(null)

		try {
			await authService.requestPasswordReset(email)
		} catch (err: any) {
			const errorMessage = err?.message || 'Failed to request password reset'
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Confirm password reset
	const confirmPasswordReset = useCallback(async (token: string, newPassword: string) => {
		setIsLoading(true)
		setError(null)

		try {
			await authService.confirmPasswordReset(token, newPassword)
		} catch (err: any) {
			const errorMessage = err?.message || 'Failed to reset password'
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Verify email
	const verifyEmail = useCallback(async (token: string) => {
		setIsLoading(true)
		setError(null)

		try {
			await authService.verifyEmail(token)
			await refreshUser()
		} catch (err: any) {
			const errorMessage = err?.message || 'Failed to verify email'
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [refreshUser])

	// Resend email verification
	const resendEmailVerification = useCallback(async () => {
		setIsLoading(true)
		setError(null)

		try {
			await authService.resendEmailVerification()
		} catch (err: any) {
			const errorMessage = err?.message || 'Failed to resend verification email'
			setError(errorMessage)
			throw err
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Clear error
	const clearError = useCallback(() => {
		setError(null)
	}, [])

	const value = {
		user,
		token,
		isLoading,
		error,
		isHydrated,
		login,
		signup,
		logout,
		sendOTP,
		verifyOTP,
		resendOTP,
		updateProfile,
		refreshUser,
		changePassword,
		requestPasswordReset,
		confirmPasswordReset,
		verifyEmail,
		resendEmailVerification,
		setError,
		clearError,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}