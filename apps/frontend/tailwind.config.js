import { heroui } from "@heroui/react"
/** @type {import('tailwindcss').Config} */

export default {
	content: [
		"./src/**/*.{js,ts,jsx,tsx}",
		"./pages/**/*.{js,ts,jsx,tsx}",
		"./components/**/*.{js,ts,jsx,tsx}",
		"./app/**/*.{js,ts,jsx,tsx}",

		// make sure it's pointing to the ROOT node_module
		"../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Inter", "sans-serif"],
			},
		},
	},
	darkMode: "class",
	plugins: [heroui()],
};