// components/RecordingTimerCircle.tsx
import React from 'react';

interface Props {
	duration: number;
	elapsed: number;
	children?: React.ReactNode;
	visible?: boolean;
}

const RecordingTimerCircle = ({ duration, elapsed, visible = false, children }: Props) => {
	const radius = 72;
	const circumference = 2 * Math.PI * radius;
	const progress = (elapsed / duration) * circumference;
	const strokeDashoffset = circumference - progress;

	return (
		<div className="relative w-[160px] h-[160px]">
			{visible && <svg width="160" height="160" className="absolute z-10 top-0 left-0 rotate-[-90deg] pointer-events-none" >
				<circle
					cx="80"
					cy="80"
					r={radius}
					stroke="#0f766e" // progress ring
					strokeWidth="10"
					fill="none"
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					strokeLinecap="round"
				/>
			</svg>}
			< div className="absolute top-0 left-0 w-full h-full flex items-center justify-center" >
				{children}
			</div>
		</div>
	);
};

export default RecordingTimerCircle;
