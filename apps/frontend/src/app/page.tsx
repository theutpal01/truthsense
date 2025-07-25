"use client";
import { useAuth } from '@/hooks/useAPI';
import { Card } from '@heroui/react';
import Link from 'next/link';
import React from 'react';
import { FaChartLine } from "react-icons/fa";
import { LuLightbulb, LuFileText } from "react-icons/lu";

const features = [
	{
		icon: <LuLightbulb className="h-8 w-8 text-primary" />,
		title: "Real-Time Smart Feedback",
		description:
			"Deliver better as you speak. Stream your camera and mic directly in the browser and get live feedback on expressions, posture, and tone of voice.",
		bullets: ["Browser-based live capture", "Visual + vocal cue detection", "Instant coaching insights"],
	},
	{
		icon: <LuFileText className="h-8 w-8 text-primary" />,
		title: "Subtext & Slide Alignment",
		description:
			"Say what you mean — and match your message. Detect over-explaining, guarded language, and check if your delivery aligns with your slides.",
		bullets: ["Tone + content analysis with AI", "Slide-to-speech matching", "Highlights delivery mismatches"],
	},
	{
		icon: <FaChartLine className="h-8 w-8 text-primary" />,
		title: "Interactive Timeline & Reports",
		description:
			"See your growth. Explore a timeline of flagged moments and export a full coaching report to PDF or HTML for offline review or sharing.",
		bullets: ["Timeline with problem hotspots", "Segment playback", "Offline report downloads"],
	},
];

const FeatureCards = () => {
	const {isAuthenticated} = useAuth();

	return (
		<section className="py-16 px-4 bg-background">
			<div className="max-w-7xl mx-auto text-center">
				<h2 className="text-5xl font-bold text-gray-900 pb-3">The <span className="text-primary">Speaking</span> App</h2>
				<p className='text-text mb-16'>Speak with purpose and confidence</p>

				<div className="grid md:grid-cols-3 gap-8">
					{features.map((feature, index) => (
						<Card
							key={index}
							className="p-6 shadow-md hover:shadow-lg transition"
						>
							<div className="flex items-center justify-center mb-4">{feature.icon}</div>
							<h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
							<p className="text-gray-600 text-sm mb-4">{feature.description}</p>
							<ul className="text-left text-sm text-gray-500 list-disc pl-5 space-y-1">
								{feature.bullets.map((point, i) => (
									<li key={i}>{point}</li>
								))}
							</ul>
						</Card>
					))}
				</div>

				{/* Login Card */}

				{!isAuthenticated && <div className="mt-16 max-w-96 min-h-40 mx-auto">
					<h3 className="text-xl font-semibold text-gray-800 mb-1">Get Started with <span className="text-primary">TruthSense</span></h3>
					<p className="text-gray-600 text-sm mb-4">Sign up to start improving your speaking skills today!</p>
					<Link href="/auth/login" className="inline-block bg-primary text-white px-8 py-3 rounded-full hover:bg-primary-dark transition">
						Join Us Now
					</Link>
				</div>}
			</div>
		</section>
	);
};

export default FeatureCards;
