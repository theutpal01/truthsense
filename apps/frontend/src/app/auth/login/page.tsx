"use client";
import { Button, Card, CardBody, CardFooter, CardHeader, Form, Input, Link, } from '@heroui/react'
import { LuMail } from "react-icons/lu";
import { TbLock } from "react-icons/tb";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { ApiError } from '@/types/auth.types';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [code, setCode] = useState('');
	const [step, setStep] = useState<'email' | 'otp'>('email');

	const { user, login, verifyOTP, isLoading, error } = useAuth();
	const router = useRouter();

	useEffect(() => {
		const handleMouseUp = () => {
			setShowPassword(false);
		}
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mouseup', handleMouseUp);
		}
	}, []);


	const handleBackToEmail = () => {
		setPassword('');
		setStep('email');
		setCode('');
	};


	const handleLogin: (e: React.FormEvent<HTMLFormElement>) => Promise<void> = async (e) => {
		e.preventDefault();
		if (!email || !password) {
			toast.warn('Please enter all required fields.');
			return;
		}

		if (!email.includes('@')) {
			toast.error('Please enter a valid email address.');
			return;
		}

		if (password.length < 8) {
			toast.error('Password must be at least 8 characters long.');
			return;
		}

		try {
			await login({ email, password });
			toast.success('Login successful! Please check your email for the OTP code.');
			router.push('/');
		} catch (err) {
			console.error('Login error:', err);
			if (err?.isVerified === false) {
				toast.info('Please verify your email first. ');
				setStep('otp');
			}
			else {
				toast.error(err.message || 'Login failed. Please try again.');
			}
		}
	};

	const handleVerifyOTP = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!code) {
			toast.warn('Please enter the verification code.');
			return;
		}

		if (code.length !== 6) {
			toast.warn('The verification code must be 6 digits long.');
			return;
		}

		try {
			const response = await verifyOTP(email, code);
			console.log("OTP verification response:", response);

			if (response.success) {
				toast.success('OTP verified successfully!');
				router.push('/auth/login');
			} else {
				toast.error(error || 'OTP verification failed.');
			}
		} catch (err: ApiError | any) {
			toast.error('An error occurred during OTP verification. Please try again.');
		}
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

						{step === 'email' ? (
							<Form onSubmit={handleLogin}>
								<div className='flex flex-col gap-4 w-full mb-12'>
									<Input
										placeholder='Email'
										variant='faded'
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										startContent={<LuMail className='text-muted size-4' />}
										required
									/>

									<Input
										placeholder='Password'
										type={`${showPassword ? 'text' : 'password'}`}
										variant='faded'
										startContent={<TbLock className='text-muted size-5' />}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										endContent={
											<button
												type='button'
												className='text-muted size-4'
												onMouseDown={() => setShowPassword(true)}
											>
												{!showPassword ?
													<FaEye className='text-muted size-4' />
													: <FaEyeSlash className='text-muted size-4' />
												}
											</button>}
									/>
								</div>

								<Button
									type='submit'
									variant='solid'
									className='bg-primary text-white hover:bg-primary-hover active:bg-primary-active font-medium w-full rounded-full'
									isLoading={isLoading}
									disabled={!email || isLoading}
								>
									{isLoading ? (email.length !== 0) ? 'Signing in...' : 'Loading...' : 'Sign In'}
								</Button>
							</Form>) : (
							<Form onSubmit={handleVerifyOTP}>
								<div className='flex flex-col gap-4 w-full mb-6'>
									<Input
										placeholder='Enter 6-digit code'
										variant='faded'
										value={code}
										onChange={(e) => setCode(e.target.value)}
										startContent={<TbLock className='text-muted size-5' />}
										maxLength={6}
									/>
								</div>

								<div className='flex flex-col gap-3 mb-6'>
									<Button
										type='submit'
										variant='solid'
										className='bg-primary text-white hover:bg-primary-hover active:bg-primary-active font-medium w-full rounded-full'
										isLoading={isLoading}
										disabled={isLoading}
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