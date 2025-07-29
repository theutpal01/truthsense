import React from 'react';

type WaveBarsProps = {
	score: number; // 0 to 100
	color?: string; // Tailwind color name like 'pink', 'blue', etc.
};

const WaveBars: React.FC<WaveBarsProps> = ({ score, color = 'pink' }) => {
	const totalBars = 5;
	const scorePerBar = 100 / totalBars;

	// Bar heights to visually match the style
	const bars = ['h-6', 'h-18', 'h-25', 'h-16', 'h-9'];

	return (
		<div className="flex justify-center items-center gap-2 min-h-36">
			{bars.map((height, index) => {
				const isActive = score >= (index + 1) * scorePerBar;

				const gradientClass = isActive
					? `bg-gradient-to-b ${color}`
					: 'bg-gradient-to-b from-gray-300 to-gray-400';

				return (
					<div
						key={index}
						className={`w-4 ${height} ${gradientClass} rounded-full shadow-md`}
					/>
				);
			})}
		</div>
	);
};

export default WaveBars;
