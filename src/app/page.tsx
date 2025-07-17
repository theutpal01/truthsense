"use client";
import RecordingPage from '@/components/recoding-page';
import Sidebar from '@/components/sidebar';
import React from 'react'

const Home = () => {
	return (
		<div className='flex gap-5 h-screen'>
			<Sidebar />
			<RecordingPage />
		</div>
	)
}

export default Home