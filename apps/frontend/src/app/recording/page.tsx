"use client";
import RecordingPage from '@/components/recoding-page'
import { useAuth } from '@/hooks/useAPI';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const RecordPage = () => {
	const { isAuthenticated, user, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && isAuthenticated === false && user === null) {
			router.push('/auth/login');
		}
	}, [isAuthenticated, user, isLoading, router]);

	// Show loading while checking auth state
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p>Loading...</p>
				</div>
			</div>
		);
	}

	// Don't render the recording page if not authenticated
	if (!isAuthenticated) {
		return null;
	}

	return (
		<RecordingPage />
	)
}

export default RecordPage