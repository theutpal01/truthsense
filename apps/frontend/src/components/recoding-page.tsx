"use client";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, Spinner } from '@heroui/react';
import React, { useRef, useEffect, useState } from 'react';
import { AnimatedWave } from './animated-wave';
import { IoMdInformationCircleOutline } from "react-icons/io";
import { PiStopFill } from 'react-icons/pi';
import Webcam from 'react-webcam';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { exportWavFromRecording } from '@/utils/audio';
import { usePostureAnalyzer } from '@/hooks/usePostureAnalyzer';
import { FeedbackCounts, initialFeedbackCounts } from '@/types/feedback.types';
import { delay, updateFeedback } from '@/utils/process';
import RecordingTimerCircle from './ui/timer';
import { useRecording, useRecordingDomains } from '@/hooks/useAPI';
import { transformPostureDataForBackend } from '@/utils/postureDataTransform';
import { useRouter } from 'next/navigation';

const MAX_DURATION = 15 * 60;


const RecordingPage = () => {
	const router = useRouter();
	const [elapsedTime, setElapsedTime] = useState(0);
	const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

	const webcamRef = useRef<Webcam>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const recordedChunksRef = useRef<Blob[]>([]);
	const [isReady, setIsReady] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [data, setData] = useState<{
		domain: string | undefined;
		sound: Blob[] | null;
	}>({
		domain: undefined,
		sound: null,
	});
	const [showWarning, setShowWarning] = useState(false);
	const [selectKey, setSelectKey] = useState(Date.now());
	const { init, analyze } = usePostureAnalyzer();

	// API hooks
	const { domains } = useRecordingDomains();
	const {
		currentRecording,
		createRecording,
		startRecording: apiStartRecording,
		stopRecording: apiStopRecording,
		uploadAudio,
		fetchRecordingAnalysis,
		deleteRecording,
		error
	} = useRecording();

	const eyeAndHeadConfidence = useRef({ sum: 0, count: 0 })
	const [feedback, setFeedback] = useState<FeedbackCounts>(initialFeedbackCounts);
	const frame = useRef<number>(0);
	const [isUploading, setIsUploading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isDone, setIsDone] = useState(false);
	const [showTimer, setShowTimer] = useState(false);

	const prepareRecording = async () => {
		setShowWarning(false);
		setShowTimer(true);
	}


	const startRecording = async () => {
		if (!webcamRef.current) return;
		recordedChunksRef.current = [];
		frame.current = 0;
		setFeedback(initialFeedbackCounts);
		setIsRecording(true);

		const stream = webcamRef.current?.stream as MediaStream | undefined;
		if (stream instanceof MediaStream) {
			const mediaRecorder = new MediaRecorder(stream, {
				mimeType: 'video/webm',
			});
			mediaRecorderRef.current = mediaRecorder;

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					console.log("Chunk available", event.data);
					recordedChunksRef.current.push(event.data);
					setData(prevData => ({
						...prevData,
						sound: [...recordedChunksRef.current],
					}));
				}
			};
			mediaRecorder.start();
			const rec = await createRecording(data.domain || "interview");
			if (!rec) {
				console.error("No current recording available after creation.");
				setIsRecording(false);
				return;
			}

			await apiStartRecording(rec.id);

		} else {
			console.error("No valid MediaStream found for recording.");
			setIsRecording(false);
		}

		const timer = setInterval(() => {
			setElapsedTime(prev => {
				if (prev + 1 >= MAX_DURATION) {
					stopRecording(); // auto stop
					clearInterval(timer);
					return 0;
				}
				return prev + 1;
			});
		}, 1000);
		setIntervalId(timer);

	};

	const stopTimer = () => {
		setElapsedTime(0);
		if (intervalId) {
			clearInterval(intervalId);
			setIntervalId(null);
		}
	}

	const stopRecording = async () => {
		stopTimer();
		setIsRecording(false);

		if (!mediaRecorderRef.current || !currentRecording) return;

		try {
			// Stop the recording session with backend
			await apiStopRecording(currentRecording.id);

			mediaRecorderRef.current.onstop = async () => {
				console.log("MediaRecorder stopped, processing...");
				setIsProcessing(true);

				// Create a blob from the recorded chunks directly
				const audioBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

				try {
					setIsProcessing(false);
					setIsUploading(true);

					const transformedPostureData = feedback;
					console.log("Uploading with posture data:", transformedPostureData);

					// Create a file from the blob
					const audioFile = new File([audioBlob], 'recording.webm', { type: 'video/webm' });

					// Upload to backend
					await uploadAudio(
						currentRecording.id,
						audioFile,
						transformedPostureData,
					);

					console.log("✅ Recording uploaded successfully!");
					setIsUploading(false);
					setIsDone(true); // Show final spinner

					// Polling for analysis result
					let attempts = 0;
					const maxAttempts = 60; // Poll for up to 5 minutes (60 * 5s)
					let analysisData = null;

					while (attempts < maxAttempts) {
						try {
							console.log(`🔄 Polling for analysis... Attempt ${attempts + 1}`
							);
							const analysis = await fetchRecordingAnalysis(currentRecording.id);
							if (analysis) {
								console.log("✅ Analysis fetched:", analysis);
								analysisData = analysis;
								break;
							}
						} catch (pollError) {
							console.warn("⌛ Analysis not ready, retrying...");
						}
						await delay(5000); // Wait 5 seconds between polls
						attempts++;
					}

					setIsDone(false); // Hide final spinner

					if (analysisData) {
						router.push(`/feedback/${currentRecording.id}`);
					} else {
						console.error("❌ Analysis not ready after multiple attempts.");
						// Handle timeout error appropriately in the UI
					}

				} catch (error) {
					console.error("❌ Failed to upload recording:", error);
					setIsProcessing(false);
					setIsUploading(false);
				}
			};

			mediaRecorderRef.current.stop();
			console.log("MediaRecorder stop called.");
		} catch (error) {
			console.error('Failed to stop recording:', error);
			setIsUploading(false);
		}
	};


	const resetRecording = () => {
		stopTimer();
		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
			mediaRecorderRef.current.onstop = () => {
				if (currentRecording) deleteRecording(currentRecording.id);
				setIsRecording(false);
				setData({
					domain: undefined,
					sound: null
				});
				recordedChunksRef.current = [];
				setSelectKey(Date.now());
			};
			mediaRecorderRef.current.stop();
		} else {
			// fallback reset if already stopped
			setIsRecording(false);
			setData({
				domain: undefined,
				sound: null
			});
			recordedChunksRef.current = [];
			setSelectKey(Date.now());
		}
		setFeedback(initialFeedbackCounts);
		frame.current = 0;
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
			const res = updateFeedback({ frame, analyze, feedback, setFeedback, webcamRef, eyeAndHeadConfidence });
			console.log(feedback);
			if (res !== null) {
				return () => clearInterval(res);
			}
		}
	}, [isReady, isRecording, analyze, feedback]);


	useEffect(() => {
		if (currentRecording?.status === 'processed') {
			fetchRecordingAnalysis(currentRecording.id)
				.then((analysis) => {
					console.log("Fetched recording analysis:", analysis);
				})
				.catch((err) => {
					console.error("Failed to fetch recording analysis:", err);
				});
		}
	}, [currentRecording, currentRecording?.id, currentRecording?.status, fetchRecordingAnalysis]);


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
					{/* Question Bubble */}
					<div className="">
						<Select key={selectKey} aria-label='Select domain' isDisabled={isRecording} disabled={isRecording} value={data.domain} variant='faded' placeholder="Select a domain" className="w-full *:text-highlight" onSelectionChange={(e) => setData({ ...data, domain: e.currentKey })}>
							{domains.map((type) => (
								<SelectItem className='text-highlight' textValue={type.label} key={type.id}>{type.label}</SelectItem>
							))}
						</Select>
					</div>

					{/* Record Button */}
					<div className="flex flex-col items-center gap-5">
						<RecordingTimerCircle visible={isRecording} duration={MAX_DURATION} elapsed={elapsedTime}>
							<button
								onClick={isRecording ? stopRecording : () => setShowWarning(true)}
								disabled={!data.domain || isRecording == null}
								className={`w-[150px] h-[150px] rounded-full bg-record-btn shadow-lg flex items-center justify-center ${data.domain != undefined ? 'cursor-pointer' : ''} transition-transform`}
							>
								<AnimatedWave isPlaying={isRecording} disabled={!data.domain} />
							</button>
						</RecordingTimerCircle>
						{isReady && isRecording && <p className="text-text text-sm">
							{String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:
							{String(elapsedTime % 60).padStart(2, '0')}
						</p>}
						<p className="text-text">
							{data.domain != undefined ? (!isRecording ? `Start Recording` : `Finish Recording`) : "Select a domain to start recording"}
						</p>
					</div>

					<div className='flex flex-col gap-5'>
						{/* Processing Status */}
						{isProcessing && (
							<div className='flex flex-col items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
								<div>
									<Spinner color='warning' />
								</div>
								<p className='text-yellow-600 text-sm font-medium'>Processing audio...</p>
							</div>
						)}

						{/* Upload Status */}
						{!isProcessing && isUploading && (
							<div className='flex flex-col items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
								<Spinner color='primary' />
								<p className='text-primary text-sm font-medium'>Uploading recording...</p>
							</div>
						)}

						{/* Error Display */}
						{!isDone && error && (
							<div className='flex flex-col items-center gap-1 p-3 bg-red-50 border border-red-200 rounded-lg'>
								<p className='text-red-600 text-sm text-center'>{error}</p>
							</div>
						)}

						{/* Success Message */}
						{currentRecording?.status === 'processing' && (
							<div className='flex flex-col items-center gap-1 p-3 bg-green-50 border border-green-200 rounded-lg'>
								<p className='text-green-600 text-sm text-center'>✅ Recording uploaded successfully!</p>
							</div>
						)}

						{isRecording && <div className='flex flex-col items-center gap-1'>
							<Button isIconOnly variant='bordered' className='w-10 h-10' onClick={resetRecording}>
								<PiStopFill className='size-6 text-red-400' />
							</Button>
							<p className='text-text'>Retry Recording</p>
						</div>}

						{/* Tip */}
						<p className="text-[10px] text-gray-400 text-center flex items-center gap-1 justify-center">
							<IoMdInformationCircleOutline size={12} /> <span className='font-bold'>Tip:</span> stay calm, relaxed & confident</p>
					</div>
				</div>
			</div>
			{isDone && (
				<div className='w-full h-screen absolute top-0 left-0 z-50 backdrop-blur bg-black/50 items-center justify-center flex flex-col gap-4'>
					<Spinner variant='wave' size='lg' className='' color='primary' />
					<p className='text-text'>Showing you the report</p>
				</div>
			)}

			<Modal isOpen={showWarning} onClose={prepareRecording} className='bg-card'>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1 text-warning">Important Warning</ModalHeader>
							<ModalBody>
								<p className='text-text'>
									Please make sure to look directly at the camera while recording. This will help us analyze your posture and provide accurate feedback. The recording will start after you close this warning.
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

			{showTimer && <div className='absolute z-40 top-0 bottom-0 left-0 right-0 flex justify-center items-center bg-background/25 backdrop-blur text-primary !text-5xl'>
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
			</div >}
		</>
	);
};

export default RecordingPage;
