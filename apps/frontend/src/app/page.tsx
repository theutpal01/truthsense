"use client";
import Loading from '@/components/ui/loading';
import { useAuth } from '@/hooks/useAPI';
import { Button, Card, CardBody, CardHeader, Image } from '@heroui/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { FaChevronDown } from 'react-icons/fa';
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
		<section className="pt-24 pb-6 px-4 h-screen bg-background flex flex-col justify-center items-center overflow-auto">
			<div className="w-full flex flex-col justify-between h-full text-center">

				<div className='flex flex-col gap-4'>
					<h2 className="text-5xl font-semibold text-primary">Your Speech Helper</h2>
					<p className='text-text mb-16 w-3/4 mx-auto'>Empower yourself through speech. Unlock your potential, sharpen your thinking, and deliver words with clarity and conviction.</p>
				</div>

				<div className='mb-8'>
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
						<p className='text-primary text-lg font-medium'>Click to Try the Demo!</p>
					</div>
				</div>

				<div>
					<Card className="py-3 bg-card !w-full !max-w-full shadow-md hover:shadow-lg transition mx-auto">
						<div className=' flex flex-col gap-1 justify-center items-center'>
							<p className="text-text text-sm">Load More </p>
							<FaChevronDown />
						</div>
					</Card>
				</div>


				<div className='flex my-16 gap-8'>
					<div className='flex-1'>
						<h2 className="text-3xl font-semibold text-primary mb-4">Why Communication Matters</h2>
						<p className='text-text'>The ability to think clearly under pressure, to articulate with precision, and to guide conversations with confidence these are the skills that define strong leaders, persuasive professionals, and compelling storytellers.

							TruthSense was built to help you practice and master these moments, so you can show up at your best-whether in an interview, a pitch, or an everyday conversation.</p>
					</div>
					<Card>
						<CardHeader className="text-2xl font-semibold text-primary mb-4">
							At a Glance
						</CardHeader>
						<CardBody>
							<ul>
								<li>Turn scattered thoughts into structured speech instantly</li>
								<li>Stay calm and composed in high-pressure situations</li>
								<li>Speak with direction, clarity, and impact</li>
								<li>Lead interactions and leave lasting impressions</li>
							</ul>
						</CardBody>

					</Card>
				</div>

				{/* <div className="grid md:grid-cols-3 gap-8">
					{features.map((feature, index) => (
						<Card
							key={index}
							className="p-6 bg-card sshadow-md hover:shadow-lg transition"
						>
							<div className="flex items-center justify-center mb-4">{feature.icon}</div>
							<h3 className={`${feature.color} text-xl font-semibold text-primary mb-2`}>{feature.title}</h3>
							<p className="text-text text-sm mb-4">{feature.description}</p>
						</Card>
					))}
				</div> */}

			</div>
			{loading && <Loading loading={loading} />}
		</section>
	);
};

export default FeatureCards;
