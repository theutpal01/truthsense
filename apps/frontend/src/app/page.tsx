"use client";
import Loading from '@/components/ui/loading';
import { useAuth } from '@/hooks/useAPI';
import { Button, Card, Image } from '@heroui/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { TiMicrophone } from 'react-icons/ti';

const features = [
	{
		icon: <Image src={"/images/utils/home/speed.svg"} />,
		title: "Think Fast Under Pressure",
		description:
			"Structure ideas instantly, even when caught off-guard.",
		color: 'text-[#F59E0B]',
	},
	{
		icon: <Image src={"/images/utils/home/star.svg"} />,
		title: "Speak Clearly & Concisely",
		description:
			"Cut filler words and communicate your point in one take.",
		color: 'text-[#6D72C3]'
	},
	{
		icon: <Image src={"/images/utils/home/chat.svg"} />,
		title: "Command Every Conversation",
		description:
			"Answer any prompt with poise and self-assurance.",
		color: 'text-[#21808D]'
	},
];

const FeatureCards = () => {
	const { isAuthenticated } = useAuth();
	const router = useRouter();
	const [loading, setLoading] = React.useState(false);

	const handleRedirect = () => {
		setLoading(true);
		router.push('/record');
		setTimeout(() => {
			setLoading(false);
		}, 2000); // Simulate loading time
	};

	return (
		<section className="py-8 px-4 h-screen bg-background flex flex-col justify-center items-center">
			<div className="max-w-7xl flex flex-col justify-between h-full mx-auto text-center">
				{!isAuthenticated &&
					<div className='flex flex-col gap-4'>
						<h2 className="text-5xl font-semibold text-primary/75">The <span className="text-primary font-bold">Speaking</span> App</h2>
						<p className='text-text mb-16'>Speak with purpose and confidence</p>
					</div>
				}

				{isAuthenticated &&
					<div className='mb-8'>
						<h2 className="text-2xl font-medium text-left text-text pb-3">Welcome back! <span className="text-primary font-bold">User</span></h2>
						<div className='flex flex-col items-center justify-center gap-4'>
							<Button
								isIconOnly={true}
								variant="faded"
								color="primary"
								className="flex bg-record-btn drop-shadow rounded-full w-72 h-72 items-center justify-center gap-2"
								onClick={handleRedirect}
							>
								<TiMicrophone className='size-48' />
							</Button>
							<p className='text-primary text-lg font-medium'>Click to start!</p>
						</div>
					</div>
				}

				<div className="grid md:grid-cols-3 gap-8">
					{features.map((feature, index) => (
						<Card
							key={index}
							className="p-6 bg-card shadow-md hover:shadow-lg transition"
						>
							<div className="flex items-center justify-center mb-4">{feature.icon}</div>
							<h3 className={`${feature.color} text-xl font-semibold text-primary mb-2`}>{feature.title}</h3>
							<p className="text-text text-sm mb-4">{feature.description}</p>
						</Card>
					))}
				</div>

				{/* Login Card */}

				{!isAuthenticated && <div className="mt-16 max-w-96 min-h-40 mx-auto">
					<h3 className="text-xl font-semibold text-primary/75 mb-1">Get Started with <span className="text-primary">TruthSense</span></h3>
					<p className="text-text text-sm mb-4">Sign up to start improving your speaking skills today!</p>
					<Link href="/auth/login" className="inline-block bg-primary text-white px-8 py-3 rounded-full hover:bg-primary-dark transition">
						Join Us Now
					</Link>
				</div>}
			</div>
			{loading && <Loading loading={loading} />}
		</section>
	);
};

export default FeatureCards;
