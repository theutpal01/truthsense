"use client";
import { AuthGuard } from '@/services/auth-guard';
import React from 'react'

const FeedbackPage = () => {
	return (
		<AuthGuard>
			<div className='h-screen w-full p-8 flex justify-center items-center'>
				<p className='text-gray-600 mt-4'>Invalid feedback item selected.</p>
			</div>
		</AuthGuard>
	)
}

export default FeedbackPage