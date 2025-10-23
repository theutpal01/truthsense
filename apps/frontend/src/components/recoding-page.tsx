"use client";

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Spinner } from '@heroui/react';
import React, { useRef, useEffect, useState } from 'react';
import { AnimatedWave } from './animated-wave';
import { IoMdInformationCircleOutline } from "react-icons/io";
import { PiStopFill } from 'react-icons/pi';
import Webcam from 'react-webcam';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { usePostureAnalyzer } from '@/hooks/usePostureAnalyzer';
import { FeedbackCounts, initialFeedbackCounts } from '@/types/feedback.types';
import { delay, updateFeedback } from '@/utils/process.utils';
import RecordingTimerCircle from './ui/timer';
import { useRouter } from 'next/navigation';
import { recordingService } from '@/services/recording.service';
import type { Recording, RecordingDomain } from '@/types/recording.types';
import { toast } from 'react-toastify';
import { uploadVideoToCloudinary } from '@/utils/cloudinary.utils';
import { useAuth } from '@/contexts/AuthContext';

const MAX_DURATION = 10 * 60;

const RecordingPage = () => {
	const router = useRouter();
	const { user } = useAuth(); // Get authenticated user
	const [elapsedTime, setElapsedTime] = useState(0);
	const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

	const webcamRef = useRef<Webcam>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const recordedChunksRef = useRef<Blob[]>([]);
	const [isReady, setIsReady] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
	const [domains, setDomains] = useState<RecordingDomain[]>([]);
	const [selectedDomain, setSelectedDomain] = useState<string | undefined>(undefined);
	const [showWarning, setShowWarning] = useState(false);
	const [selectKey, setSelectKey] = useState(Date.now());
	const { init, analyze } = usePostureAnalyzer();

	const eyeAndHeadConfidence = useRef({ sum: 0, count: 0 });
	const [feedback, setFeedback] = useState<FeedbackCounts>(initialFeedbackCounts);
	const frame = useRef<number>(0);
	const [isLoading, setIsLoading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [showTimer, setShowTimer] = useState(false);

	// Load domains on mount
	useEffect(() => {
		loadDomains();
	}, []);

	const loadDomains = async () => {
		try {
			const domainsData = await recordingService.getDomains();
			setDomains(domainsData);
		} catch (err: any) {
			console.error('Failed to load domains:', err);
			toast.error(err.message || 'Failed to load domains');
		}
	};

	const prepareRecording = async () => {
		setShowWarning(false);
		setShowTimer(true);
	};

	const startRecording = async () => {
		if (isLoading) return;
		if (!webcamRef.current || !selectedDomain || !user) return;

		recordedChunksRef.current = [];
		frame.current = 0;
		setFeedback(initialFeedbackCounts);
		setIsRecording(true);

		const stream = webcamRef.current?.stream as MediaStream | undefined;
		if (!(stream instanceof MediaStream)) {
			console.error("No valid MediaStream found for recording.");
			setIsRecording(false);
			toast.error('No valid MediaStream found for recording.');
			return;
		}

		try {
			// Create recording on backend
			const recording = await recordingService.createRecording({ domain: selectedDomain });
			setCurrentRecording(recording);

			// Start recording session on backend
			const startedRecording = await recordingService.startRecording(recording.id);
			setCurrentRecording(startedRecording);

			// Start media recorder
			const mediaRecorder = new MediaRecorder(stream, {
				mimeType: 'video/webm',
			});
			mediaRecorderRef.current = mediaRecorder;

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					recordedChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.start();

			// Start timer
			const timer = setInterval(() => {
				setElapsedTime(prev => {
					return prev + 1;
				});
			}, 1000);
			setIntervalId(timer);

		} catch (err: any) {
			console.error("Failed to start recording:", err);
			toast.error(err.message || 'Failed to start recording');
			setIsRecording(false);
			setCurrentRecording(null);
		}
	};

	const stopTimer = () => {
		setElapsedTime(0);
		if (intervalId) {
			clearInterval(intervalId);
			setIntervalId(null);
		}
	};

	useEffect(() => {
		if (elapsedTime >= MAX_DURATION) {
			stopRecording();
		}
	}, [elapsedTime]);


	const stopRecording = async () => {
		stopTimer();
		setIsRecording(false);
		setIsLoading(true);

		if (!mediaRecorderRef.current || !currentRecording || !user) return;

		try {
			// Stop the recording session with backend
			const stoppedRecording = await recordingService.stopRecording(currentRecording.id);
			setCurrentRecording(stoppedRecording);

			mediaRecorderRef.current.onstop = async () => {
				console.log("MediaRecorder stopped, processing...");

				// Create video blob
				const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
				const videoFile = new File([videoBlob], 'recording.webm', { type: 'video/webm' });

				console.log("📹 Video file created:", {
					size: (videoFile.size / 1024 / 1024).toFixed(2) + ' MB',
					type: videoFile.type
				});

				try {
					// STEP 1: Upload video to Cloudinary
					await toast.promise(
						async () => {
							const cloudinaryResult = await uploadVideoToCloudinary(
								videoFile,
								user,
								currentRecording.id,
								(progress) => {
									setUploadProgress(progress);
									console.log(`Upload progress: ${progress}%`);
								}
							);

							return cloudinaryResult
						},
						{
							pending: 'Uploading video...',
							success: 'Video uploaded successfully!',
							error: 'Failed to upload video.',
						}
					).then(async (cloudinaryResult) => {

						try {
							const uploadedRecording = await recordingService.uploadAudio(
								currentRecording.id,
								{
									audioFile: videoFile,
									postureFeatures: feedback,
									secureUrl: cloudinaryResult.secure_url,
									publicId: cloudinaryResult.public_id,
									videoFileSize: videoFile.size,
								}
							);
							console.log("✅ Recording data saved:", uploadedRecording);
							setCurrentRecording(uploadedRecording);
						} catch (uploadErr) {
							console.error("❌ Saving recording data failed:", uploadErr);
							toast.error('Failed to save recording data');
						}

					}).catch((uploadErr) => {
						console.error("❌ Cloudinary upload failed:", uploadErr);
						throw uploadErr;
					});

					// STEP 2: Poll for analysis
					try {

						await toast.promise(
							(async () => {
								console.log("⏱️ Starting to poll for analysis...");
								const processedRecording = await recordingService.pollRecordingStatus(
									currentRecording.id,
									5000, // Poll every 5 seconds
									60    // Max 60 attempts (5 minutes)
								);
								return processedRecording;
							})(),
							{
								pending: 'Processing recording, please wait...',
								success: 'Recording processed successfully!',
								error: 'Failed to process recording.',
							}
						).then(async (processedRecording) => {
							console.log("✅ Recording processed:", processedRecording);
							setIsLoading(false);
							// Navigate to feedback page
							router.push(`/feedback/${currentRecording.id}`);
						}).catch((pollError) => {
							console.error("❌ Analysis polling failed:", pollError);
							toast.error("Analysis timed out. Please check back later.");
							setIsLoading(false);
						});

					} catch (pollErr: any) {
						console.error("❌ Failed to poll for analysis:", pollErr);
						toast.error(pollErr.message || 'Failed to get analysis');
						setIsLoading(false);
					}

				} catch (uploadError: any) {
					console.error("❌ Failed to upload video:", uploadError);
					toast.error(uploadError.message || 'Failed to upload video');
					setIsLoading(false);
					setUploadProgress(0);
				}
			};

			mediaRecorderRef.current.stop();
			console.log("MediaRecorder stop called.");

		} catch (err: any) {
			console.error('Failed to stop recording:', err);
			toast.error('Failed to stop recording');
			setIsLoading(false);
		}
	};

	const resetRecording = async () => {
		stopTimer();

		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
			mediaRecorderRef.current.onstop = async () => {
				await cleanupRecording();
			};
			mediaRecorderRef.current.stop();
		} else {
			await cleanupRecording();
		}
	};

	const cleanupRecording = async () => {
		try {
			if (currentRecording) {
				await recordingService.deleteRecording(currentRecording.id);
			}
		} catch (err) {
			console.error('Failed to delete recording:', err);
		}

		setIsRecording(false);
		setCurrentRecording(null);
		setSelectedDomain(undefined);
		recordedChunksRef.current = [];
		setSelectKey(Date.now());
		setFeedback(initialFeedbackCounts);
		frame.current = 0;
		setUploadProgress(0);
	};

	useEffect(() => {
		if (webcamRef.current?.video) {
			webcamRef.current.video.muted = true;
			webcamRef.current.video.volume = 0;
		}
	}, []);

	useEffect(() => {
		init().then(() => setIsReady(true));
	}, [init]);

	useEffect(() => {
		if (isReady && isRecording) {
			const res = updateFeedback({
				frame,
				analyze,
				feedback,
				setFeedback,
				webcamRef,
				eyeAndHeadConfidence
			});
			if (res !== null) {
				return () => clearInterval(res);
			}
		}
	}, [isReady, isRecording, analyze]);

	return (
		<>
			<div className="w-full h-screen flex p-12 gap-12">
				{/* Video Section */}
				<div className="flex-1 rounded-xl overflow-hidden shadow-lg">
					<Webcam
						ref={webcamRef}
						audio
						videoConstraints={{
							width: 1280,
							height: 720,
							facingMode: "user"
						}}
						className="scale-x-[-1] rounded-xl w-full h-full object-cover"
						mirrored={false}
					/>
				</div>

				{/* Sidebar Section */}
				<div className="flex flex-col justify-between w-full md:w-[250px] gap-4">
					{/* Domain Selection */}
					<div className="">
						<Select
							key={selectKey}
							aria-label='Select domain'
							isDisabled={isRecording || isLoading}
							disabled={isRecording || isLoading}
							selectedKeys={selectedDomain ? [selectedDomain] : []}
							variant='faded'
							placeholder="Select a domain"
							className="w-full *:text-highlight"
							onSelectionChange={(keys) => {
								const key = Array.from(keys)[0] as string;
								setSelectedDomain(key);
							}}
						>
							{domains.map((domain) => (
								<SelectItem
									className='text-highlight'
									textValue={domain.label}
									key={domain.id}
								>
									{domain.label}
								</SelectItem>
							))}
						</Select>
					</div>

					{/* Record Button */}
					<div className="flex flex-col items-center gap-5">
						<RecordingTimerCircle
							visible={isRecording}
							duration={MAX_DURATION}
							elapsed={elapsedTime}
						>
							<button
								onClick={isRecording ? stopRecording : () => { !isLoading && setShowWarning(true) }}
								disabled={!selectedDomain || isLoading}
								className={`w-[150px] h-[150px] rounded-full bg-record-btn shadow-lg flex items-center justify-center ${(selectedDomain && !isLoading) || (isRecording && !isLoading) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} transition-transform`}
							>
								<AnimatedWave isPlaying={isRecording} disabled={!selectedDomain || isLoading} />
							</button>
						</RecordingTimerCircle>

						{isReady && isRecording && (
							<p className="text-text text-sm">
								{String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:
								{String(elapsedTime % 60).padStart(2, '0')}
							</p>
						)}


						<p className="text-text text-center">
							{selectedDomain && !isLoading
								? (!isRecording ? 'Start Recording' : 'Finish Recording')
								: (!isLoading) ? "Select a domain to start recording" : ""
							}
						</p>
					</div>

					<div className='flex flex-col gap-5'>
						{/* Retry Button */}
						{isRecording && (
							<div className='flex flex-col items-center gap-1'>
								<Button
									isIconOnly
									variant='bordered'
									className='w-10 h-10'
									onClick={resetRecording}
								>
									<PiStopFill className='size-6 text-red-400' />
								</Button>
								<p className='text-text'>Retry Recording</p>
							</div>
						)}

						{/* Tip */}
						<p className="text-[10px] text-gray-400 text-center flex items-center gap-1 justify-center">
							<IoMdInformationCircleOutline size={12} />
							<span className='font-bold'>Tip:</span> stay calm, relaxed & confident
						</p>
					</div>
				</div>
			</div>

			{/* Warning Modal */}
			<Modal isOpen={showWarning} onClose={prepareRecording} className='bg-card'>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1 text-warning">
								Important Warning
							</ModalHeader>
							<ModalBody>
								<p className='text-text'>
									Please make sure to look directly at the camera while recording.
									This will help us analyze your posture and provide accurate feedback.
									The recording will start after you close this warning.
								</p>
							</ModalBody>
							<ModalFooter>
								<Button className='!bg-error' onPress={onClose}>
									Close
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* Countdown Timer */}
			{showTimer && (
				<div className='absolute z-40 top-0 bottom-0 left-0 right-0 flex justify-center items-center bg-background/25 backdrop-blur text-primary !text-5xl'>
					<CountdownCircleTimer
						isPlaying={showTimer}
						duration={3}
						onComplete={() => {
							startRecording();
							setShowTimer(false);
						}}
						colors={"#21808D"}
					>
						{({ remainingTime }) => remainingTime}
					</CountdownCircleTimer>
				</div>
			)}
		</>
	);
};

export default RecordingPage;
