export const STORAGE_KEYS = {
	ACCESS_TOKEN: "auth_access_token",
	REFRESH_TOKEN: "auth_refresh_token",
	USER_DATA: "auth_user_data",
} as const

class StorageService {
	private isClient(): boolean {
		return typeof window !== "undefined"
	}

	get(key: string): string | null {
		if (!this.isClient()) return null

		try {
			return localStorage.getItem(key)
		} catch (error) {
			console.error(`Error reading from localStorage: ${key}`, error)
			return null
		}
	}

	set(key: string, value: string): void {
		if (!this.isClient()) return

		try {
			localStorage.setItem(key, value)
		} catch (error) {
			console.error(`Error writing to localStorage: ${key}`, error)
		}
	}

	remove(key: string): void {
		if (!this.isClient()) return

		try {
			localStorage.removeItem(key)
		} catch (error) {
			console.error(`Error removing from localStorage: ${key}`, error)
		}
	}

	clear(): void {
		if (!this.isClient()) return

		try {
			Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key))
		} catch (error) {
			console.error("Error clearing localStorage", error)
		}
	}

	getJSON<T>(key: string): T | null {
		const item = this.get(key)
		if (!item) return null

		try {
			return JSON.parse(item) as T
		} catch (error) {
			console.error(`Error parsing JSON from localStorage: ${key}`, error)
			return null
		}
	}

	setJSON<T>(key: string, value: T): void {
		try {
			this.set(key, JSON.stringify(value))
		} catch (error) {
			console.error(`Error stringifying JSON to localStorage: ${key}`, error)
		}
	}
}

export const storageService = new StorageService()