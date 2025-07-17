"use client";
import { Button, Card, CardBody, CardFooter, CardHeader, Form, Input, Link, } from '@heroui/react'
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa6";
import { LuMail } from "react-icons/lu";
import { TbLock, TbLockCog } from "react-icons/tb";
import React, { useEffect } from 'react'

const Register = () => {
	const [showPassword, setShowPassword] = React.useState(false);
	const [showCPassword, setShowCPassword] = React.useState(false);

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

	return (
		<div className='bg-register flex flex-col items-center justify-center h-screen'>
			<div className='p-12 bg-white/20 border border-white/30 shadow-2xl backdrop-blur-xs rounded-2xl'>
				<Card className='z-10 max-w-[28em] p-8 bg-background-card-two/90 shadow-none backdrop-blur-2xl' >
					<CardHeader className='flex flex-col gap-4 items-baseline'>
						<h2 className='text-highlight font-lato text-2xl font-medium'>
							SIGN UP
						</h2>
						<p className='text-highlight font-inter text-sm'>
							Great communication starts with a single step—and you just took it. Sign up to begin your journey toward confident, clear, and impactful speech
						</p>
					</CardHeader>
					<CardBody className='flex flex-col mt-4'>
						<Form>
							<div className='flex flex-col gap-4 w-full'>
								<Input
									placeholder='Username'
									variant='faded'
									startContent={<FaRegUser className='text-muted' />}
								/>
								<Input
									placeholder='Email'
									variant='faded'
									startContent={<LuMail className='text-muted size-4' />}
								/>
								<Input
									placeholder='Password'
									type={`${showPassword ? 'text' : 'password'}`}
									variant='faded'
									startContent={<TbLock className='text-muted size-5' />}
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

							<Button variant='solid' className='mt-12 bg-primary text-white hover:bg-primary-hover active:bg-primary-active font-medium w-full rounded-full'>
								Sign Up
							</Button>
						</Form>
					</CardBody>

					<CardFooter className='flex flex-col gap-4'>
						<p className='text-muted font-inter text-xs text-center'>
							Already have an account? <Link href='/auth/login' className='text-primary font-semibold text-xs'>Log in</Link>
						</p>
					</CardFooter>
				</Card>

			</div>
		</div>
	)
}

export default Register