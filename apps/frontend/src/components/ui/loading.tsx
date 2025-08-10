import React, { useEffect } from 'react'
import { AnimatedWave } from '../animated-wave'

const Loading = ({ loading }: { loading: boolean }) => {
	const loadingTexts = [
		"Loading",
		"Please wait",
		"Almost there",
		"Just a moment",
		"Hang tight",
		"Preparing your experience"
	];

	const [randomText, setRandomText] = React.useState(loadingTexts[0]);

	useEffect(() => {
		const interval = setInterval(() => {
			// This will trigger a re-render every 2 seconds to change the loading text
			setRandomText(loadingTexts[Math.floor(Math.random() * loadingTexts.length)]);
		}, 2000);

		return () => clearInterval(interval);
	});

	return (
		<div className='h-screen fixed top-0 bottom-0 left-0 right-0 flex items-center justify-center bg-background z-30 flex-col'>
			<AnimatedWave colorClass='text-text' isPlaying={loading} speed='fast' />
			<p className='text-muted'>{randomText}</p>
		</div>
	)
}

export default Loading