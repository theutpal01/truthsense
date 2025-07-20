import { AnimatedWaveProps } from "@/types/ui.types";

export const AnimatedWave = ({
	colorClass = 'text-teal-500',
	size = 'w-20 h-20',
	width = 'w-6',
	speed = 'slow', // 'slow', 'medium', 'fast'
	isPlaying = false,
	disabled = false
}: AnimatedWaveProps) => {
	// Heights matching the image pattern - symmetrical bars
	const bars = [
		{ height: 'h-4', delay: '0s', variant: 'wave' },
		{ height: 'h-8', delay: '0.3s', variant: 'wave-alt' },
		{ height: 'h-16', delay: '0.6s', variant: 'wave' },
		{ height: 'h-14', delay: '0.9s', variant: 'wave-alt' },
		{ height: 'h-10', delay: '1.2s', variant: 'wave' },
		{ height: 'h-12', delay: '1.5s', variant: 'wave-alt' },
		{ height: 'h-3', delay: '1.8s', variant: 'wave' }
	];

	return (
		<div className={`relative ${size} flex items-center justify-center`}>
			<div className={`w-full h-full ${colorClass} flex items-center gap-1 justify-center`}
			>
				{bars.map((bar, index) => (
					<div
						key={index}
						className={`${isPlaying ? `animate-${bar.variant}` : ''} ${!disabled ? 'bg-bar' : 'bg-bar-disabled'} ${bar.height} ${width} rounded-full`}
						style={{
							animationDelay: bar.delay,
							animationDuration: speed === 'fast' ? '3s' : speed === 'medium' ? '4s' : '5s'
						}}
					/>
				))}
			</div>
		</div>

	);
};
