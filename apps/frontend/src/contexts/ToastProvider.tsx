// app/providers/ToastProvider.tsx
"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "./ThemeContext";

export default function ToastProvider({ children }: { children: React.ReactNode }) {
	const { theme } = useTheme();
	return (
		<>
			{children}
			<ToastContainer theme={theme} autoClose={2000} position="bottom-right" limit={3} />
		</>
	);
};