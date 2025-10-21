export interface User {
	id: string;
	name: string;
	email: string;
	isVerified: boolean;
	lastLoginAt?: string;
	createdAt?: string;
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

export interface ApiError {
	message: string;
	statusCode?: number;
	errors?: Record<string, string[]>;
}