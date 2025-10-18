"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TbLayoutDashboard, TbWaveSine, TbChartPie, TbHistory, TbLogout } from "react-icons/tb";
import { Image, Switch } from "@heroui/react";
import { useAuth } from "@/hooks/useAPI";
import { useRouter } from "next/navigation";
import { FaRegMoon, FaRegSun } from "react-icons/fa";
import { useTheme } from "@/contexts/ThemeContext";

const Sidebar = () => {
	const { isAuthenticated, logout } = useAuth();
	const pathname = usePathname();
	const router = useRouter();
	const { theme, setTheme } = useTheme();

	const handleLogout = () => {
		logout();
		router.push('/');
	};

	const navItems = [
		{ href: "/", icon: <TbLayoutDashboard className="size-5" /> },
		{ href: "/record", icon: <TbWaveSine className="size-5" /> },
		{ href: "/feedback", icon: <TbChartPie className="size-5" /> },
		{ href: "/history", icon: <TbHistory className="size-5" /> },
	];

	const utilItems = [
		{ onClick: handleLogout, icon: <TbLogout className="size-5" /> }
	];

	const isActive = (href: string) => {
		if (href === '/') {
			return pathname === '/';
		}
		return pathname === href || pathname.startsWith(href + '/');
	};

	return (
		<aside className="flex bg-card flex-col items-center rounded-r-2xl text-text drop-shadow z-20 h-full overflow-hidden py-3">
			{/* Logo */}
			<div className="h-12 flex items-center w-full mb-8">
				<Link className="h-6 w-6 mx-auto" href="/">
					<Image src={"/logo.svg"} alt="Logo" width={24} height={24} className="h-6 w-6" />
				</Link>
			</div>

			{/* Nav Items */}
			<div className="flex flex-col items-center space-y-4 mb-4 px-2.5">
				{navItems.map((item, index) => (
					<Link
						key={index}
						href={item.href}
						className={`${isActive(item.href) ? 'active-sidebar-btn shadow' : ''} hover:text-primary p-3 rounded-[40%]`}
					>
						{item.icon}
					</Link>
				))}
			</div>

			<div className="flex flex-col items-center justify-end flex-1 w-full">
				{/* Theme Toggle */}
				<div className="h-full flex-3/4 gap-6 flex flex-col items-center justify-center">
					<FaRegSun className={theme === "light" ? "text-primary" : "text-text"} />
					<Switch
						classNames={{
							base: "rotate-90",
							wrapper: "rounded-lg inset-shadow bg-theme-btn h-8 w-14",
							thumb: "rounded bg-thumb drop-shadow h-6 w-6 m-0",
						}}
						isSelected={theme === "dark"}
						onValueChange={(checked) => setTheme(checked ? "dark" : "light")}
					/>
					<FaRegMoon className={theme === "dark" ? "text-primary" : "text-text"} />
				</div>

				{/* Bottom Action */}
				{isAuthenticated && (
					<div className="mt-auto flex flex-col flex-1/4 items-center justify-end">
						{utilItems.map((item, index) => (
							<button
								key={index}
								className="h-14 cursor-pointer mx-auto flex justify-center items-center w-full hover:text-primary transition-colors"
								onClick={item.onClick}
							>
								{item.icon}
							</button>
						))}
					</div>
				)}
			</div>
		</aside>
	);
};

export default Sidebar;