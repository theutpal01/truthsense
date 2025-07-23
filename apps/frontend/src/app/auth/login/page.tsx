"use client";
import { Button, Card, CardBody, CardFooter, CardHeader, Checkbox, Form, Input, Link, } from '@heroui/react'
import { LuMail } from "react-icons/lu";
import { TbLock } from "react-icons/tb";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import React from 'react'

const Login = () => {
	const [showPassword, setShowPassword] = React.useState(false);

		React.useEffect(() => {
			const handleMouseUp = () => {
				setShowPassword(false);
			}
			document.addEventListener('mouseup', handleMouseUp);
	
			return () => {
				document.removeEventListener('mouseup', handleMouseUp);
			}
		}, []);

	return (
		<div className='bg-login flex flex-col items-center justify-center h-screen'>
			<div className='p-12 bg-white/20 border border-white/30 shadow-2xl backdrop-blur-xs rounded-2xl'>
				<Card className='z-10 max-w-[28em] p-8 bg-background-card-two/90 shadow-none backdrop-blur-2xl' >
					<CardHeader className='flex flex-col gap-4 items-baseline'>
						<h2 className='text-highlight font-lato text-2xl font-semibold'>
							Welcome Back!
						</h2>
						<p className='text-highlight font-inter text-sm'>
							It&apos;s great to have you back. Whether you&apos;re preparing for an interview, a class presentation, or just building your confidence, TruthSense is here to support your progress—one session at a time.
						</p>
					</CardHeader>
					<CardBody className='flex flex-col mt-4'>
						<h2 className='text-highlight font-inter text-xl font-base mb-4'>
							LOGIN
						</h2>
						<Form>
							<div className='flex flex-col gap-4 w-full'>
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
										</button>
									} />
							</div>

							<div className='flex w-full justify-between mb-12 mt-2'>
								<Checkbox className=' font-inter *:text-xs' size='sm'>
									<p className='text-muted'>Remember me</p>
								</Checkbox>
								<Link href='/auth/forgot-password' className='text-muted font-inter text-xs'>
									Forgot password?
								</Link>
							</div>

							<Button variant='solid' className='bg-primary text-white hover:bg-primary-hover active:bg-primary-active font-medium w-full rounded-full'>
								Log In
							</Button>
						</Form>
					</CardBody>

					<CardFooter className='flex flex-col gap-4'>
						<p className='text-muted font-inter text-xs text-center'>
							Don&apos;t have an account? <Link href='/auth/register' className='text-primary font-semibold text-xs'>Sign up</Link>
						</p>
					</CardFooter>
				</Card>
			</div>

		</div>
	)
}

export default Login