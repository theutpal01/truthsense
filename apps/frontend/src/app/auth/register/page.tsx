"use client";
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, CardBody, CardFooter, CardHeader, Form, Input, Link } from '@heroui/react'
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { FaRegUser } from "react-icons/fa6";
import { LuMail } from "react-icons/lu";
import { TbLock, TbLockCog } from "react-icons/tb";
import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify';
import { ApiError } from 'next/dist/server/api-utils';

const Register = () => {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	});

	const { email } = formData;
	const { signup, isLoading, error, setError } = useAuth();

	const [showPassword, setShowPassword] = React.useState(false);
	const [showCPassword, setShowCPassword] = React.useState(false);
	const [step, setStep] = useState<'register' | 'verify'>('register');
	const [code, setCode] = useState('');
	const router = useRouter();

	const { sendOTP, verifyOTP } = useAuth();

	useEffect(() => {
		const handleMouseUp = () => {
			setShowCPassword(false);
			setShowPassword(false);
		}
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mouseup', handleMouseUp);
		}
	}, []);


	const handleBackToEmail = () => {
		setFormData({ ...formData, password: '', confirmPassword: '' });
		setStep('register');
		setCode('');
	};

	const handleSendOTP: (e: React.FormEvent<HTMLFormElement>) => Promise<void> = async (e) => {
		console.log("handleSendOTP called");
		e.preventDefault();

		if (!formData.email || !formData.password || !formData.name) {
			toast.warn('Please fill all fields correctly.');
			return;
		}

		if (formData.password.length < 8) {
			toast.warn('Password must be at least 8 characters long.');
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			toast.warn('Passwords do not match.');
			return;
		}

		if (!formData.email.includes('@')) {
			toast.error('Please enter a valid email address.');
			return;
		}

		try {
			await signup({ name: formData.name, email: formData.email, password: formData.password });

			if (error) {
				throw new Error(error);
			}
			toast.info('Verification code sent! Please check your email.');
			setStep('verify');

		} catch (err: ApiError | any) {
			console.error("Error during registration or sending OTP:", err);
			toast.error(err.message || 'An error occurred while registering. Please try again.');
		} finally {
			setError(null);
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
				toast.success('OTP verified! Redirecting to login...');
				router.push('/auth/login');
			} else {
				toast.error(error || 'OTP verification failed.');
			}
		} catch (err: ApiError | any) {
			toast.error('An error occurred during OTP verification. Please try again.');
		}
	};


	return (
		<div className='bg-register flex flex-col items-center justify-center h-screen'>
			<div className='p-12 bg-background/20 border border-border/30 shadow-2xl backdrop-blur-xs rounded-2xl'>
				<Card className='z-10 max-w-[28em] p-8 bg-background-card-two/90 shadow-none backdrop-blur-2xl' >
					<CardHeader className='flex flex-col gap-4 items-baseline'>
						<h2 className='text-highlight font-lato text-2xl font-medium'>
							SIGN UP
						</h2>
						<p className='text-highlight font-inter text-sm'>
							{step === "register" ?
								"Great communication starts with a single step—and you just took it. Sign up to begin your journey toward confident, clear, and impactful speech" :
								"We've sent a 6-digit code to your email. Enter it below to complete your login."
							}
						</p>
					</CardHeader>
					<CardBody className='flex flex-col mt-4'>
						{step == "register" ? (
							<Form onSubmit={handleSendOTP}>
								<div className='flex flex-col gap-4 w-full'>
									<Input
										placeholder='Name'
										variant='faded'
										startContent={<FaRegUser className='text-muted' />}
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									/>
									<Input
										placeholder='Email'
										variant='faded'
										startContent={<LuMail className='text-muted size-4' />}
										value={formData.email}
										onChange={(e) => setFormData({ ...formData, email: e.target.value })}
									/>
									<Input
										placeholder='Password'
										type={`${showPassword ? 'text' : 'password'}`}
										variant='faded'
										startContent={<TbLock className='text-muted size-5' />}
										value={formData.password}
										onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
									<Input
										placeholder='Confirm Password'
										type={`${showCPassword ? 'text' : 'password'}`}
										variant='faded'
										startContent={<TbLockCog className='text-muted size-5' />}
										value={formData.confirmPassword}
										onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
										endContent={
											<button
												type='button'
												className='text-muted size-4'
												onMouseDown={() => setShowCPassword(true)}
											>
												{!showCPassword ?
													<FaEye className='text-muted size-4' />
													: <FaEyeSlash className='text-muted size-4' />
												}
											</button>}
									/>
								</div>

								<Button type='submit' variant='solid' className='mt-12 bg-primary text-white hover:bg-primary-hover active:bg-primary-active font-medium w-full rounded-full'
									isLoading={isLoading}
									disabled={isLoading}
								>
									{isLoading ? 'Registering...' : 'Sign Up'}
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
							Already have an account? <Link href='/auth/login' className='text-primary font-semibold text-xs'>Log in</Link>
						</p>
					</CardFooter>
				</Card>

			</div>
		</div>
	)
}

export default Register