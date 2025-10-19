import type { Metadata } from "next";
import { Geist, Lato, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ClientLayoutWrapper from "./client-wrapper";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastContainer } from "react-toastify";
import ToastProvider from "@/contexts/ToastProvider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const lato = Lato({
	variable: "--font-lato",
	subsets: ["latin"],
	weight: ["300", "400", "700"],
});

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
	title: "Truthsense",
	description: "A speech practice app to help you think fast and speak clearly.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {

	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${lato.variable} ${inter.variable} antialiased bg-background overglow-hidden`}
			>
				<Providers>
					<AuthProvider>
						<ThemeProvider>
							<ClientLayoutWrapper>
								<ToastProvider>
									<div className="overflow-hidden relative min-h-screen">
										{children}
									</div>
								</ToastProvider>
							</ClientLayoutWrapper>
						</ThemeProvider>
					</AuthProvider>
				</Providers>
			</body>
		</html>
	);
}
