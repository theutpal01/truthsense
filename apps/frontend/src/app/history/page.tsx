"use client";
import Loading from '@/components/ui/loading';
import { useRecording } from '@/hooks/useAPI'
import { AuthGuard } from '@/services/auth-guard';
import { Button } from '@heroui/react';
import { useRouter } from "next/navigation";
import React, { useEffect } from 'react'
import { FaTrash } from 'react-icons/fa';
import { FaChevronRight } from 'react-icons/fa6';

const HistoryPage = () => {
	const router = useRouter();
	const [loading, setLoading] = React.useState("");
	const [delLoading, setDelLoading] = React.useState("");
	const { fetchRecordings, isLoading, recordings, deleteRecording } = useRecording();

	// Fetch recordings when component mounts (will only run if authenticated due to AuthGuard)
	useEffect(() => {
		if (recordings.length === 0) {
			fetchRecordings();
		}
	}, [fetchRecordings, recordings.length]);

	const handleNavigation = (e: React.MouseEvent) => {
		const recordingId = e.currentTarget.getAttribute('data-id');
		setLoading(recordingId || "");
		if (recordingId) {
			router.push(`/feedback/${recordingId}`);
		}
	};

	const deleteReport = async (id: string) => {
		try {
			setDelLoading(id);
			// Call API to delete recording
			await deleteRecording(id);
			// Refetch recordings after deletion
			await fetchRecordings();
		} catch (error) {
			console.error("❌ Failed to delete recording:", error);
		} finally {
			setDelLoading("");
		}
	};

	return (
		<AuthGuard>
			<div className='w-full h-screen overflow-hidden'>
				<h2 className='text-3xl font-bold px-16 py-8 text-primary'>History</h2>
				<div className='flex flex-col max-w-full py-8 px-16 overflow-y-auto w-full h-[90vh]'>
					{recordings.length > 0 ? (
						recordings.map((recording) => (
							<div key={recording.id} className='bg-card bg-white shadow-md w-full rounded-xl p-4 mb-4 flex justify-between items-center'>
								<div className='flex flex-col'>
									<h3 className='text-lg font-semibold text-text'>{recording.domain[0]?.toUpperCase() + recording.domain.slice(1)}</h3>
									<p className='text-muted'>Date: {new Date(recording.createdAt).toLocaleDateString()}</p>
									<p className='text-muted'>Duration: {recording.duration} seconds</p>
								</div>
								<div className='flex items-center space-x-2'>
									<Button
									isLoading={delLoading === recording.id}
										onClick={() => deleteReport(recording.id)}
										isIconOnly={true}
										className='ml-auto bg-error/20 border border-error text-white hover:bg-error/30 rounded-[40%]'
									>
										<FaTrash className='text-error' />
									</Button>
									<Button
										key={recording.id}
										data-id={recording.id}
										isLoading={loading == recording.id}
										isIconOnly={true}
										onClick={handleNavigation}
										className='ml-auto bg-primary/20 border border-primary text-white hover:bg-primary-hover/40 rounded-[40%]'
									>
										<FaChevronRight className='text-primary' />
									</Button>
								</div>
							</div>
						))
					) : (
						<p className='text-muted'>No recordings found.</p>
					)}
				</div>
			</div>
			{isLoading && <Loading loading={isLoading} />}
		</AuthGuard>
	)
}

export default HistoryPage