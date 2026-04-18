// components/ClientLayoutWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import { ReactNode, useEffect, useState } from "react";

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		// Only check for mobile on client side
		const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
		const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
		setIsMobile(mobileRegex.test(userAgent));
	}, []);

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
			<div className="flex-1 relative overflow-auto">{children}</div>
		</div>
	);
}
