// components/ClientLayoutWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import { isMobile } from "react-device-detect";
import Sidebar from "@/components/sidebar";
import { ReactNode, useEffect, useState } from "react";

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const [theme, setTheme] = useState<'light' | 'dark' | null>('light');

	useEffect(() => {
		setTheme(localStorage.getItem('theme') as 'light' | 'dark' | null);

		if (theme) {
			if (theme === 'dark' && !document.body.classList.contains('dark')) {
				document.body.classList.remove('light');
				document.body.classList.add('dark');
			} else if (theme === 'light' && !document.body.classList.contains('light')) {
				document.body.classList.remove('dark');
				document.body.classList.add('light');
			}
		} else {
			localStorage.setItem('theme', 'light');
			document.body.classList.add('light');
		}
	}, [theme]);

	if (isMobile) {
		return (
			<div className="flex flex-col justify-center items-center h-screen">
				<p className="text-lg font-medium uppercase">Website not available on mobile devices</p>
			</div>
		);
	}

	const hideSidebar = pathname.includes("/auth") || pathname.includes("/error");

	return (
		<div className="flex h-screen">
			{!hideSidebar && <Sidebar />}
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
}
