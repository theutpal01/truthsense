import { STORAGE_KEYS, storageService } from "./storage.utils"

interface TokenPayload {
	exp: number
	iat: number
	userId?: string
	email?: string
}

class TokenManager {
	setTokens(accessToken: string, refreshToken?: string): void {
		storageService.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
		if (refreshToken) {
			storageService.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
		}
	}

	getAccessToken(): string | null {
		return storageService.get(STORAGE_KEYS.ACCESS_TOKEN)
	}

	getRefreshToken(): string | null {
		return storageService.get(STORAGE_KEYS.REFRESH_TOKEN)
	}

	clearTokens(): void {
		storageService.remove(STORAGE_KEYS.ACCESS_TOKEN)
		storageService.remove(STORAGE_KEYS.REFRESH_TOKEN)
	}

	hasTokens(): boolean {
		return !!(this.getAccessToken())
	}

	decodeToken(token: string): TokenPayload | null {
		if (typeof window === "undefined") return null

		try {
			const parts = token.split('.')
			if (parts.length !== 3) return null

			const payload = JSON.parse(window.atob(parts[1] as string))
			return payload as TokenPayload
		} catch (error) {
			console.error("Error decoding token:", error)
			return null
		}
	}

	isTokenExpired(token: string): boolean {
		const payload = this.decodeToken(token)
		if (!payload) return true

		const currentTime = Date.now() / 1000
		return payload.exp < currentTime
	}

	isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
		const payload = this.decodeToken(token)
		if (!payload) return true

		const currentTime = Date.now() / 1000
		const thresholdSeconds = thresholdMinutes * 60
		return payload.exp - currentTime < thresholdSeconds
	}

	hasValidToken(): boolean {
		const token = this.getAccessToken()
		if (!token) return false

		return !this.isTokenExpired(token)
	}
}

export const tokenManager = new TokenManager()
