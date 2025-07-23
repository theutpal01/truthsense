// components/ClientLayoutWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import { isMobile } from "react-device-detect";
import Sidebar from "@/components/sidebar";
import { ReactNode } from "react";

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
	const pathname = usePathname();

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
