'use client';

import { Card } from '@heroui/react';
import React from 'react';

const WordsMeter = ({ wpm }: { wpm: number }) => {
	const maxWpm = 200;
	const clampedWpm = Math.min(Math.max(wpm, 0), maxWpm);
	const percent = clampedWpm / maxWpm;

	// SVG dimensions
	const svgWidth = 200;
	const svgHeight = 120;
	const centerX = svgWidth / 2;
	const centerY = svgHeight;
	const radius = 80;

	// Background arc path (full semicircle)
	const backgroundPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;

	// Calculate the total arc length (half circle = π * radius)
	const totalArcLength = Math.PI * radius;

	// Calculate how much of the arc should be visible based on percentage
	const visibleArcLength = totalArcLength * percent;

	return (
		<Card className="relative w-80 h-80 p-8 flex flex-col items-center justify-center">
			{/* Main meter container */}
			<div className="relative w-full h-80">
				<svg
					viewBox={`0 0 ${svgWidth} ${svgHeight}`}
					className="w-full h-full"
					style={{ overflow: 'visible' }}
				>
					{/* Gradient definitions */}
					<defs>
						{/* Background gradient */}
						<linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="#e5e7eb" />
							<stop offset="100%" stopColor="#d1d5db" />
						</linearGradient>

						{/* Meter gradient - matches the image colors */}
						<linearGradient id="meterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
							<stop offset="0%" stopColor="#ef4444" />
							<stop offset="30%" stopColor="#f97316" />
							<stop offset="60%" stopColor="#eab308" />
							<stop offset="85%" stopColor="#84cc16" />
							<stop offset="100%" stopColor="#22c55e" />
						</linearGradient>
					</defs>

					Background arc (full semicircle)
					<path
						d={backgroundPath}
						fill="none"
						stroke="url(#bgGradient)"
						strokeWidth="14"
						strokeLinecap="round"
					/>

					{/* Progress arc */}
					<path
						d={backgroundPath}
						fill="none"
						stroke="url(#meterGradient)"
						strokeWidth="14"
						strokeLinecap="round"
						strokeDasharray={totalArcLength}
						strokeDashoffset={totalArcLength - visibleArcLength}
						style={{
							filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
							transition: 'stroke-dashoffset 0.3s ease-out'
						}}
					/>
				</svg>

				{/* Center content */}
				<div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
					<div className="text-4xl font-bold text-orange-500 mb-1">
						{Math.round(clampedWpm)}
					</div>
					<div className="text-lg text-orange-400 font-medium">
						WPM
					</div>
				</div>
			</div>

			{/* Bottom section */}
			<div className="mt-3 w-full">
				<div className="text-text font-medium text-center tracking-wide">
					Speaking Pace
				</div>
			</div>
		</Card >
	);
};


export default WordsMeter;