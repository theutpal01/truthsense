"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TbLayoutDashboard, TbWaveSine, TbChartPie, TbHistory, TbSettings, TbLogout } from "react-icons/tb";
import { Image } from "@heroui/react";
import { useAuth } from "@/hooks/useAPI";

const Sidebar = () => {
	const { isAuthenticated, logout } = useAuth();
	const pathname = usePathname();

	const navItems = [
		{ href: "/", icon: <TbLayoutDashboard className="size-5" /> },
		{ href: "/recording", icon: <TbWaveSine className="size-5" /> },
		{ href: "/feedback/video", icon: <TbChartPie className="size-5" /> },
		{ href: "/history", icon: <TbHistory className="size-5" /> },
	];

	const utilItems = [
		{ href: "/settings", onClick: () => { }, icon: <TbSettings className="size-5" /> },
		{ href: ".", onClick: logout, icon: <TbLogout className="size-5" /> }
	];

	return (
		<aside className="flex flex-col items-center bg-background-card-two rounded-r-2xl text-text drop-shadow h-full overflow-hidden py-3 border-r border-r-gray-50/50">
			{/* Logo */}
			<div className="h-12 flex items-center w-full mb-2">
				<Link className="h-6 w-6 mx-auto" href="/">
					<Image src={"/logo.svg"} alt="Logo" width={24} height={24} className="h-6 w-6" loading="lazy" />
				</Link>
			</div>

			{/* Nav Items */}
			<ul>
				{navItems.map((item, index) => (
					<li
						key={index}
						className={`border-3 border-transparent ${pathname === item.href ? 'border-r-primary text-primary' : ''} hover:text-primary`}
					>
						<Link
							href={item.href}
							className="h-14 px-6 flex justify-center items-center w-full focus:text-primary"
						>
							{item.icon}
						</Link>
					</li>
				))}
			</ul>

			{/* Bottom Action */}
			{isAuthenticated && (
				<div className="mt-auto flex flex-col items-center w-full">
					{utilItems.map((item, index) => (
						<button
							key={index}
							className="h-14 cursor-pointer mx-auto flex justify-center items-center w-full"
							onClick={item.onClick}
						>
							{item.icon}
						</button>
					))}
				</div>
			)}
		</aside>
	);
};

export default Sidebar;
