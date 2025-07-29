// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/services/apiMethods';

export interface User {
	id: string;
	email: string;
	isVerified: boolean;
	lastLoginAt?: string;
	createdAt?: string;
}

type AuthState = {
	user: User | null;
	token: string | null;
	isLoading: boolean;
	error: string | null;
	hasHydrated: boolean;
	setHasHydrated: (state: boolean) => void;
	setLoading: (loading: boolean) => void;
	setUser: (user: User) => void;
	login: (token: string) => void;
	logout: () => void;
	sendOTP: (email: string) => Promise<void>;
	verifyOTP: (email: string, code: string) => Promise<{ success: boolean }>;
};

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			token: null,
			isLoading: false,
			error: null,
			hasHydrated: false,

			setHasHydrated: (state) => set(() => ({ hasHydrated: state })),
			setLoading: (loading) => set(() => ({ isLoading: loading })),
			setUser: (user) => set(() => ({ user })),
			login: (token) => set(() => ({ token })),
			logout: () => set(() => ({ user: null, token: null })),

			sendOTP: async (email) => {
				set({ isLoading: true, error: null });
				try {
					await authAPI.sendOTP(email);
				} catch (err: any) {
					set({ error: err?.response?.data?.message || 'Failed to send OTP' });
					throw err;
				} finally {
					set({ isLoading: false });
				}
			},

			verifyOTP: async (email, code) => {
				set({ isLoading: true, error: null });
				try {
					const res = await authAPI.verifyOTP(email, code);
					if (res?.success && res?.token) {
						set({ token: res.token });
						return { success: true };
					}
					return { success: false };
				} catch (err: any) {
					set({ error: err?.response?.data?.message || 'Failed to verify OTP' });
					return { success: false };
				} finally {
					set({ isLoading: false });
				}
			},
		}),
		{
			name: 'auth-storage',
			partialize: (state) => ({
				token: state.token,
				user: state.user,
			}),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		}
	)
);
