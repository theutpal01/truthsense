"use client";
import { useAuth, useRecording } from '@/hooks/useAPI'
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react'

const HistoryPage = () => {
	const { isAuthenticated, user, isLoading } = useAuth();
	const { fetchRecordings, recordings } = useRecording();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && isAuthenticated === false && user === null) {
			router.push('/auth/login');
		}
	}, [isAuthenticated, user, isLoading, router]);


	useEffect(() => {
		if (isAuthenticated) {
			fetchRecordings();
		}
	}, [isAuthenticated, fetchRecordings]);


	return (
		<div className='container mx-auto flex flex-col h-screen px-16 py-8'>
			<h2 className='text-2xl font-bold text-primary'>History</h2>
			<div className='flex-1 overflow-y-auto'>
				{recordings.length > 0 ? (
					recordings.map((recording) => (
						<div key={recording.id} className='bg-white shadow-md rounded-lg p-4 mb-4'>
							<h3 className='text-lg font-semibold'>{recording.domain[0]?.toUpperCase() + recording.domain.slice(1)}</h3>
							<p className='text-gray-600'>Date: {new Date(recording.createdAt).toLocaleDateString()}</p>
							<p className='text-gray-600'>Duration: {recording.duration} seconds</p>
							<a href={`/recording/${recording.id}`} className='text-primary hover:underline'>View Recording</a>
						</div>
					))
				) : (
					<p>No recordings found.</p>
				)}
			</div>
		</div>
	)
}

export default HistoryPage