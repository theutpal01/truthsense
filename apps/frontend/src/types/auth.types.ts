export interface User {
	id: string;
	name: string;
	email: string;
	isVerified: boolean;
	lastLoginAt?: string;
	createdAt?: string;
}


export interface AuthContextType {
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

	refreshUser: () => Promise<void>

	// Password methods
	changePassword: (data: PasswordResetConfirm) => Promise<void>
	requestPasswordReset: (email: string) => Promise<void>

	// Error handling
	setError: (error: string | null) => void
	clearError: () => void
}


export interface AuthTokens {
	access: string;
	refresh: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface SignupCredentials {
	email: string;
	password: string;
	name?: string;
}

export interface OTPVerificationResponse {
	success: boolean;
	token?: string;
	refreshToken?: string;
	user?: User;
	message?: string;
}

export interface RegisterResponse {
	success: boolean;
	message: string;
	userId: string;
}

export interface AuthResponse {
	user: User;
	token: string;
	refreshToken?: string;
	success: boolean;
	error?: string;
	message?: string;
}

export interface PasswordResetRequest {
	email: string;
}

export interface PasswordResetConfirm {
	email: string;
	code: string;
	newPassword: string;
}

export interface PasswordResetResponse {
	success: boolean;
	message?: string;
	error?: string;
}

export interface ApiError {
	message: string;
	statusCode?: number;
	errors?: Record<string, string[]>;
}