"use client";

import Loading from '@/components/ui/loading';
import { recordingService } from '@/services/recording.service';
import type { Recording } from '@/types/recording.types';
import { Button } from '@heroui/react';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { FaChevronRight } from 'react-icons/fa6';
import { changeCategoryCase } from '@/utils/process.utils';

const HistoryPage = () => {
	const router = useRouter();
	const [recordings, setRecordings] = useState<Recording[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [navigatingId, setNavigatingId] = useState("");
	const [deletingId, setDeletingId] = useState("");

	// Fetch recordings when component mounts
	useEffect(() => {
		loadRecordings();
	}, []);

	const loadRecordings = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const data = await recordingService.getUserRecordings();
			// Sort by creation date, newest first
			const sortedData = data.sort((a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			);
			setRecordings(sortedData);
		} catch (err: any) {
			console.error('Failed to load recordings:', err);
			setError(err.message || 'Failed to load recordings');
		} finally {
			setIsLoading(false);
		}
	};

	const handleNavigation = (recordingId: string) => {
		setNavigatingId(recordingId);
		router.push(`/feedback/${recordingId}`);
	};

	const deleteReport = async (id: string) => {
		setDeletingId(id);
		setError(null);

		try {
			await recordingService.deleteRecording(id);
			// Remove from local state immediately for better UX
			setRecordings(prev => prev.filter(r => r.id !== id));
		} catch (err: any) {
			console.error("Failed to delete recording:", err);
			setError(err.message || 'Failed to delete recording');
			// Optionally reload recordings to ensure consistency
			await loadRecordings();
		} finally {
			setDeletingId("");
		}
	};

	const formatDuration = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}m ${secs}s`;
	};

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
		} else if (date.toDateString() === yesterday.toDateString()) {
			return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
		} else {
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		}
	};

	const getStatusBadge = (status: Recording['status']) => {
		const statusConfig = {
			processed: { color: 'bg-green-100 text-green-700 border-green-300', text: 'Completed' },
			processing: { color: 'bg-blue-100 text-blue-700 border-blue-300', text: 'Processing' },
			failed: { color: 'bg-red-100 text-red-700 border-red-300', text: 'Failed' },
			completed: { color: 'bg-purple-100 text-purple-700 border-purple-300', text: 'Uploaded' },
			recording: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', text: 'Recording' },
			idle: { color: 'bg-gray-100 text-gray-700 border-gray-300', text: 'Idle' },
		};

		const config = statusConfig[status] || statusConfig.idle;

		return (
			<span className={`px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
				{config.text}
			</span>
		);
	};

	if (isLoading) {
		return <Loading loading={isLoading} />;
	}

	return (
		<div className='w-full h-screen overflow-hidden'>
			<div className='px-16 py-8'>
				<h2 className='text-3xl font-bold text-primary'>History</h2>
				<p className='text-muted mt-2'>
					{recordings.length} {recordings.length === 1 ? 'recording' : 'recordings'} found
				</p>
			</div>

			{/* Error Display */}
			{error && (
				<div className='mx-16 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
					<p className='text-red-600 text-sm'>{error}</p>
				</div>
			)}

			<div className='flex flex-col max-w-full py-4 px-16 overflow-y-auto w-full h-[calc(100vh-180px)]'>
				{recordings.length > 0 ? (
					<div className='space-y-4'>
						{recordings.map((recording) => (
							<div
								key={recording.id}
								className='bg-card bg-white shadow-md w-full rounded-xl p-4 hover:shadow-lg transition-shadow'
							>
								<div className='flex justify-between items-center'>
									<div className='flex-1'>
										<div className='flex items-center gap-3 mb-2'>
											<h3 className='text-lg font-semibold text-text capitalize'>
												{changeCategoryCase(recording.domain)}
											</h3>
											{getStatusBadge(recording.status)}
										</div>

										<div className='space-y-1'>
											<p className='text-muted text-sm'>
												📅 {formatDate(recording.createdAt)}
											</p>
											<p className='text-muted text-sm'>
												⏱️ Duration: {formatDuration(recording.duration)}
											</p>
											{recording.analysisResult && (
												<p className='text-muted text-sm'>
													📊 Score: {recording.analysisResult.overallScore || 'N/A'}
												</p>
											)}
										</div>

										{/* Error Message for Failed Recordings */}
										{recording.status === 'failed' && recording.errorMessage && (
											<div className='mt-2 p-2 bg-red-50 border border-red-200 rounded'>
												<p className='text-red-600 text-xs'>
													⚠️ {recording.errorMessage}
												</p>
											</div>
										)}
									</div>

									<div className='flex items-center space-x-2 ml-4'>
										{/* Delete Button */}
										<Button
											isLoading={deletingId === recording.id}
											onClick={() => deleteReport(recording.id)}
											isIconOnly={true}
											className='bg-error/20 border border-error text-white hover:bg-error/30 rounded-[40%]'
											aria-label='Delete recording'
										>
											<FaTrash className='text-error' />
										</Button>

										{/* View Button - Only show for processed recordings */}
										{recording.status === 'processed' && (
											<Button
												isLoading={navigatingId === recording.id}
												isIconOnly={true}
												onClick={() => handleNavigation(recording.id)}
												className='bg-primary/20 border border-primary text-white hover:bg-primary-hover/40 rounded-[40%]'
												aria-label='View recording details'
											>
												<FaChevronRight className='text-primary' />
											</Button>
										)}

										{/* Processing Indicator */}
										{recording.status === 'processing' && (
											<div className='flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg'>
												<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
												<span className='text-xs text-blue-600'>Processing...</span>
											</div>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className='flex flex-col items-center justify-center py-16'>
						<div className='text-center'>
							<div className='text-6xl mb-4'>📝</div>
							<h3 className='text-xl font-semibold text-text mb-2'>
								No recordings yet
							</h3>
							<p className='text-muted mb-6'>
								Start recording to see your history here
							</p>
							<Button
								className='bg-primary text-white hover:bg-primary-hover'
								onClick={() => router.push('/record')}
							>
								Start Recording
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default HistoryPage;