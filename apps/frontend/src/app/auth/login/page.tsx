"use client";
import { Button, Card, CardBody, CardFooter, CardHeader, Form, Input, Link, } from '@heroui/react'
import { LuMail } from "react-icons/lu";
import { TbLock } from "react-icons/tb";
import { useAuth } from '../../../hooks/useAPI';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const Login = () => {
	const [email, setEmail] = useState('');
	const [code, setCode] = useState('');
	const [step, setStep] = useState<'email' | 'otp'>('email');
	const { isAuthenticated, sendOTP, verifyOTP, isLoading, error } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isAuthenticated && !isLoading) {
			router.push('/');
		}
	}, [isAuthenticated, router, isLoading]);


	const handleSendOTP: (e: React.FormEvent<HTMLFormElement>) => Promise<void> = async (e) => {
		e.preventDefault();
		if (!email) return;
		
		try {
			await sendOTP(email);
			setStep('otp');
		} catch {
			// Error is handled by the hook
		}
	};

	const handleVerifyOTP = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!code) return;
		
		try {
			const response = await verifyOTP(email, code);
			if (response.success) {
				router.push('/');
			}
		} catch {
			// Error is handled by the hook
		}
	};

	const handleBackToEmail = () => {
		setStep('email');
		setCode('');
	};

	return (
		<div className='bg-login flex flex-col items-center justify-center h-screen'>
			<div className='p-12 bg-background/20 border border-border/30 shadow-2xl backdrop-blur-xs rounded-2xl'>
				<Card className='z-10 max-w-[28em] p-8 bg-background-card-two/90 shadow-none backdrop-blur-2xl' >
					<CardHeader className='flex flex-col gap-4 items-baseline'>
						<h2 className='text-highlight font-lato text-2xl font-semibold'>
							Welcome Back!
						</h2>
						<p className='text-highlight font-inter text-sm'>
							{step === 'email' 
								? "It's great to have you back. Whether you're preparing for an interview, a class presentation, or just building your confidence, TruthSense is here to support your progress—one session at a time."
								: "We've sent a 6-digit code to your email. Enter it below to complete your login."
							}
						</p>
					</CardHeader>
					<CardBody className='flex flex-col mt-4'>
						<h2 className='text-highlight font-inter text-xl font-base mb-4'>
							{step === 'email' ? 'LOGIN' : 'VERIFY CODE'}
						</h2>
						
						{error && (
							<div className='mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm'>
								{error}
							</div>
						)}

						{step === 'email' ? (
							<Form onSubmit={handleSendOTP}>
								<div className='flex flex-col gap-4 w-full mb-12'>
									<Input
										placeholder='Email'
										variant='faded'
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										startContent={<LuMail className='text-muted size-4' />}
										required
									/>
								</div>

								<Button 
									type='submit'
									variant='solid' 
									className='bg-primary text-white hover:bg-primary-hover active:bg-primary-active font-medium w-full rounded-full'
									isLoading={isLoading}
									disabled={!email || isLoading}
								>
									{isLoading ? (email.length !== 0) ? 'Sending...' : 'Loading...' : 'Send Login Code'}
								</Button>
							</Form>
						) : (
							<Form onSubmit={handleVerifyOTP}>
								<div className='flex flex-col gap-4 w-full mb-6'>
									<Input
										placeholder='Enter 6-digit code'
										variant='faded'
										value={code}
										onChange={(e) => setCode(e.target.value)}
										startContent={<TbLock className='text-muted size-5' />}
										maxLength={6}
										required
									/>
								</div>

								<div className='flex flex-col gap-3 mb-6'>
									<Button 
										type='submit'
										variant='solid' 
										className='bg-primary text-white hover:bg-primary-hover active:bg-primary-active font-medium w-full rounded-full'
										isLoading={isLoading}
										disabled={!code || code.length !== 6 || isLoading}
									>
										{isLoading ? 'Verifying...' : 'Verify & Login'}
									</Button>
									
									<Button 
										type='button'
										variant='light' 
										className='text-primary font-medium w-full rounded-full'
										onClick={handleBackToEmail}
										disabled={isLoading}
									>
										Back to Email
									</Button>
								</div>
							</Form>
						)}
					</CardBody>

					<CardFooter className='flex flex-col gap-4'>
						<p className='text-text font-inter text-xs text-center'>
							Don&apos;t have an account? <Link href='/auth/register' className='text-primary font-semibold text-xs'>Sign up</Link>
						</p>
					</CardFooter>
				</Card>
			</div>
		</div>
	)
}

export default Login