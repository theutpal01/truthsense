"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{
	theme: Theme;
	setTheme: (theme: Theme) => void;
} | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	const [theme, setTheme] = useState<'light' | 'dark'>('light');
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		const localTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
		if (localTheme === 'dark' || localTheme === 'light') {
			setTheme(localTheme);
		}
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (theme && isHydrated) {
			document.body.classList.remove('light', 'dark');
			document.body.classList.add(theme);
			localStorage.setItem('theme', theme);
		}
	}, [theme, isHydrated]);

	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) throw new Error('useTheme must be used within a ThemeProvider');
	return context;
};
