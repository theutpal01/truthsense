"use client";
import { Button } from '@heroui/react'
import Link from 'next/link'
import React from 'react'

const Home = () => {
	return (
		<div className='flex gap-5 justify-center items-center h-screen'>
			<Link href="/auth/login">LOGIN</Link>
			<Button variant="solid">
				<Link href="/auth/login">LOGIN</Link>
			</Button>
			<Link href="/auth/register">SIGN UP</Link>
		</div>
	)
}

export default Home