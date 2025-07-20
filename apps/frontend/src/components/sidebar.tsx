"use client";

import React from "react";
import Link from "next/link";
import { TbLayoutDashboard, TbWaveSine, TbChartPie, TbHistory, TbSettings, TbLogout } from "react-icons/tb";
import { Image } from "@heroui/react";

const Sidebar = () => {
	const navItems = [
		{ href: ".", icon: <TbLayoutDashboard className="size-5"/> },
		{ href: ".", icon: <TbWaveSine className="size-5"/> },
		{ href: ".", icon: <TbChartPie className="size-5"/> },
		{ href: ".", icon: <TbHistory className="size-5"/> },
	];

	const utilItems = [
		{ href: ".", icon: <TbSettings className="size-5"/> },
		{ href: ".", icon: <TbLogout className="size-5"/> }
	];

	return (
		<aside className="flex flex-col items-center bg-background-card-two rounded-r-2xl text-text shadow-lg h-full overflow-hidden py-3 border-r border-r-gray-50/50">
			{/* Logo */}
			<div className="h-12 flex items-center w-full mb-2">
				<a className="h-6 w-6 mx-auto" href="http://localhost:3000">
					<Image src={"/logo.svg"} alt="Logo" width={24} height={24} className="h-6 w-6" loading="lazy"
					/>
				</a>
			</div>

			{/* Nav Items */}
			<ul>
				{navItems.map((item, index) => (
					<li key={index} className="border-3 border-transparent hover:border-r-primary-hover  focus:border-r-primary">
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
			<div className="mt-auto flex flex-col items-center w-full">
				{
					utilItems.map((item, index) => (
						<button key={index} className="h-14 mx-auto flex justify-center items-center w-full">
							{item.icon}
						</button>
					))
				}
			</div>
		</aside>
	);
};

export default Sidebar;
