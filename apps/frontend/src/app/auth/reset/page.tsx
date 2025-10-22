"use client";
import { Button, Card, CardBody, CardFooter, CardHeader, Form, Input, Link, } from '@heroui/react'
import { LuMail } from "react-icons/lu";
import { TbEye, TbEyeOff, TbLock } from "react-icons/tb";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { ApiError, PasswordResetResponse } from '@/types/auth.types';
import { authService } from '@/services/auth.service';

const ForgetPassword = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [code, setCode] = useState('');
	const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');

	const { isLoading, requestPasswordReset, changePassword, error } = useAuth();
	const router = useRouter();

	useEffect(() => {
		const handleMouseUp = () => {
			setShowPassword(false);
			setShowConfirmPassword(false);
		}
		document.addEventListener('mouseup', handleMouseUp);

		return () => {
			document.removeEventListener('mouseup', handleMouseUp);
		}
	}, []);


	const handleRequestReset: (e: React.FormEvent<HTMLFormElement>) => Promise<void> = async (e) => {
		e.preventDefault();
		if (!email) {
			toast.warn('Please enter your email address.');
			return;
		}
		if (!email.includes('@')) {
			toast.error('Please enter a valid email address.');
			return;
		}

		try {
			const res = await requestPasswordReset(email);
			toast.success('Password reset code sent to your email.');
			setStep('otp');
		} catch (err) {
			toast.error(error || err?.error || 'Failed to send password reset code. Please try again.');
		}
	};

	const handleBackToEmail = () => {
		setPassword('');
		setStep('email');
		setCode('');
	};

	const handleVerifyOTP: (e: React.FormEvent<HTMLFormElement>) => Promise<void> = async (e) => {
		e.preventDefault();
		if (!code || code.length !== 6) {
			toast.warn('Please enter the 6-digit code sent to your email.');
			return;
		}
		setStep('reset');
	};


	const handleChangePassword: (e: React.FormEvent<HTMLFormElement>) => Promise<void> = async (e) => {
		e.preventDefault();
		if (!password || !confirmPassword) {
			toast.warn('Please enter all required fields.');
			return;
		}

		if (password.length < 8) {
			toast.error('Password must be at least 8 characters long.');
			return;
		}
		if (password !== confirmPassword) {
			toast.error('Passwords do not match.');
			return;
		}

		try {
			await changePassword({ email, code, newPassword: password });
			toast.success('Password changed successfully! You can now log in with your new password.');
			router.push('/auth/login');
		} catch (err) {
			toast.error(error || err?.error || 'Failed to change password. Please try again.');
		}
	};

	return (
		<div className='bg-login flex flex-col items-center justify-center h-screen'>
			<div className='p-12 bg-background/20 border border-border/30 shadow-2xl backdrop-blur-xs rounded-2xl'>
				<Card className='z-10 max-w-[28em] p-8 bg-background-card-two/90 shadow-none backdrop-blur-2xl' >
					<CardHeader className='flex flex-col gap-4 items-baseline'>
						<h2 className='text-highlight font-lato text-2xl font-semibold'>
							{step !== 'reset' ? 'Forgot Password?' : 'Change Your Password'}
						</h2>
						<p className='text-highlight font-inter text-sm'>
							{step === 'email'
								? "Enter your email to receive a password reset code."
								: (step === 'otp') ? "We've sent a 6-digit code to your email. Please enter it below to reset your password." : "Enter your new password below to reset your account password."
							}
						</p>
					</CardHeader>
					<CardBody className='flex flex-col mt-4'>
						<h2 className='text-highlight font-inter text-xl font-base mb-4'>
							RESET PASSWORD
						</h2>

						{step === 'email' ? (
							<Form onSubmit={handleRequestReset}>
								<div className='flex flex-col gap-4 w-full mb-12'>
									<Input
										placeholder='Email'
										variant='faded'
										type='email'
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
									{isLoading ? (email.length !== 0) ? 'Sending Code...' : 'Loading...' : 'Send Code'}
								</Button>
							</Form>)
							: (step === 'otp') ?
								(<Form onSubmit={handleVerifyOTP}>
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
											{isLoading ? 'Verifying...' : 'Verify Code'}
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
								) : (<Form onSubmit={handleChangePassword}>
									<div className='flex flex-col gap-4 w-full mb-12'>
										<Input
											placeholder='New Password'
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
										<Input
											placeholder='Confirm Password'
											type={`${showConfirmPassword ? 'text' : 'password'}`}
											variant='faded'
											startContent={<TbLock className='text-muted size-5' />}
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											endContent={
												<button
													type='button'
													className='text-muted size-4'
													onMouseDown={() => setShowConfirmPassword(true)}
												>
													{!showConfirmPassword ?
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
										disabled={!password || isLoading}
									>
										{isLoading ? (password.length !== 0) ? 'Resetting Password...' : 'Loading...' : 'Reset Password'}
									</Button>
								</Form>)
						}
					</CardBody>

					<CardFooter className='flex flex-col gap-4'>
						{step !== 'otp' && <p className='text-text font-inter text-xs text-center'>
							Don&apos;t have an account? <Link href='/auth/register' className='text-primary font-semibold text-xs'>Sign up</Link>
						</p>}
					</CardFooter>
				</Card>
			</div>
		</div>
	)
}

export default ForgetPassword;