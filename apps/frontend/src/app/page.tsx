"use client";
import Loading from '@/components/ui/loading';
import { Button, Card, CardBody, CardHeader, Image } from '@heroui/react';
import { useRouter } from 'next/navigation';
import React, { useRef } from 'react';
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

const info = [{
	title: "Record Freely",
	description: "Speak naturally and capture your true delivery.",
	color: 'text-[#F59E0B]'
}, {
	title: "AI-Powered Insights",
	description: "Get real-time analysis on clarity, tone, and pacing.",
	color: 'text-[#6D72C3]'
}, {
	title: "Lead Every Exchange",
	description: "Take charge of interactions with balance and ease. Make sure your words steer the conversation and leave a mark that lasts.",
	color: 'text-[#E93B6C]'
}, {
	title: "Clarity That Resonates",
	description: "Communication is about connection. TruthSense helps you express with clarity so your message resonates deeply with any audience.",
	color: 'text-[#10B981]'
}];

const FeatureCards = () => {
	const router = useRouter();
	const [loading, setLoading] = React.useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	const handleRedirect = () => {
		setLoading(true);
		router.push('/record');
		setTimeout(() => {
			setLoading(false);
		}, 2000);
	};

	const handleLoadMore = () => {
		setTimeout(() => {
			contentRef.current?.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		}, 150);
	};

	return (
		<section className="*:pt-16 *:pb-6 px-4 bg-background flex flex-col justify-center items-center overflow-auto">

			<div className="w-full flex flex-col justify-between h-screen text-center">

				<div className='flex flex-col gap-4'>
					<h2 className="text-5xl font-semibold text-primary">Your Speech Helper</h2>
					<p className='text-text mb-8 w-3/4 mx-auto'>Empower yourself through speech. Unlock your potential, sharpen your thinking, and deliver words with clarity and conviction.</p>
				</div>

				<div className='my-8 flex grow justify-center items-center'>
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
					<Card
						className={`bg-record-btn !w-full !max-w-full shadow-md mx-auto transition-all duration-300 ease-in-out py-3`}
					>
						<button
							onClick={handleLoadMore}
							className="flex flex-col gap-1 justify-center items-center w-fit mx-auto cursor-pointer hover:text-primary transition-all duration-300"
						>
							<p className="text-text text-sm">Load More</p>
							<FaChevronDown className={`transition-transform duration-300`} />
						</button>
					</Card>
				</div>
			</div>

			<div ref={contentRef} className='w-full flex flex-col justify-center items-center mt-8'>
				<div className='h-fit flex gap-8 px-8'>
					<div className='w-7/12 text-left'>
						<h2 className="text-3xl font-semibold text-primary mb-4">Why Communication Matters</h2>
						<p className='text-text'>The ability to think clearly under pressure, to articulate with precision, and to guide conversations with confidence these are the skills that define strong leaders, persuasive professionals, and compelling storytellers.<br />
							TruthSense was built to help you practice and master these moments, so you can show up at your best-whether in an interview, a pitch, or an everyday conversation.</p>
					</div>
					<Card className='p-4 w-5/12 bg-card shadow-md hover:shadow-lg transition'>
						<CardHeader className="text-2xl font-semibold text-primary mb-4">
							At a Glance
						</CardHeader>
						<CardBody>
							<ul className='list-disc list-inside text-text space-y-2'>
								<li>Turn scattered thoughts into structured speech instantly</li>
								<li>Stay calm and composed in high-pressure situations</li>
								<li>Speak with direction, clarity, and impact</li>
								<li>Lead interactions and leave lasting impressions</li>
							</ul>
						</CardBody>

					</Card>
				</div>

				<div className='mt-8'>
					<div className='my-16'>
						<div className='text-center w-7/12 mx-auto'>
							<h2 className="text-3xl font-semibold text-primary mb-4">
								From Scattered Thoughts to Sharp Expression
							</h2>
							<p className='text-text'>
								TruthSense helps you move from hesitation to confidence, giving you the tools to organize your ideas quickly and communicate them with precision. It&apos;s not about memorizing speeches-it&apos;s about being ready for the unexpected.
							</p>
						</div>

						<div className="flex w-full flex-wrap items-center justify-center gap-8 mt-12">
							{info.map((inf, index) => (
								<Card
									key={index}
									className="p-6 bg-card w-full min-h-42 max-w-96 sshadow-md hover:shadow-lg transition"
								>
									<h3 className={`${inf.color} text-xl font-semibold mb-2`}>{inf.title}</h3>
									<p className="text-text text-sm mb-4">{inf.description}</p>
								</Card>
							))}
						</div>
					</div>


					<div className='my-24'>
						<div className='text-center w-7/12 mx-auto'>
							<h2 className="text-3xl font-semibold text-primary mb-4">
								Practice Without Pressure
							</h2>
							<p className='text-text'>
								With guided prompts and instant feedback, you can refine your communication anytime. Build habits that make composure and clarity second nature.
							</p>
						</div>

						<div className="grid md:grid-cols-3 gap-8 px-8 mt-12">
							{features.map((feature, index) => (
								<Card
									key={index}
									className="p-6 text-center bg-card sshadow-md hover:shadow-lg transition"
								>
									<div className="flex items-center justify-center mb-4">{feature.icon}</div>
									<h3 className={`${feature.color} text-xl font-semibold text-primary mb-2`}>{feature.title}</h3>
									<p className="text-text text-sm mb-4">{feature.description}</p>
								</Card>
							))}
						</div>


					</div>
				</div>


			</div>

			{loading && <Loading loading={loading} />}
		</section>
	);
};

export default FeatureCards;