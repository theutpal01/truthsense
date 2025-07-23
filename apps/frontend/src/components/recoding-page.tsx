"use client";
import { Button, Select, SelectItem, Spinner } from '@heroui/react';
import React, { useRef, useEffect, useState } from 'react';
import { AnimatedWave } from './animated-wave';
import { IoMdInformationCircleOutline } from "react-icons/io";
import { PiStopFill } from 'react-icons/pi';
import Webcam from 'react-webcam';
import { exportWavFromRecording } from '@/utils/audio';
import { usePostureAnalyzer } from '@/hooks/usePostureAnalyzer';
import { FeedbackCounts, initialFeedbackCounts } from '@/types/feedback.types';
import { updateFeedback } from '@/utils/process';
import RecordingTimerCircle from './ui/timer';
import { useRecording, useRecordingDomains } from '@/hooks/useAPI';
import { transformPostureDataForBackend } from '@/utils/postureDataTransform';


// const soloCommunicationTypes = [
// 	// Formal/Professional (solo types only)
// 	{ key: "interview", label: "Interview" },
// 	{ key: "speech", label: "Speech" },
// 	{ key: "presentation", label: "Presentation" },
// 	{ key: "lecture", label: "Lecture" },
// 	{ key: "briefing", label: "Briefing" },
// 	{ key: "conference_talk", label: "Conference Talk" },

// 	// Creative / Performative
// 	{ key: "monologue", label: "Monologue" },
// 	{ key: "poetry_recital", label: "Poetry Recital" },
// 	{ key: "spoken_word", label: "Spoken Word" },
// 	{ key: "improv", label: "Improv" }, // solo improv sessions
// 	{ key: "storytelling", label: "Storytelling" },

// 	// Analytical / Reflective
// 	{ key: "think_aloud", label: "Think-Aloud" },
// 	{ key: "self_talk", label: "Self-Talk" },
// 	{ key: "vlog_entry", label: "Vlog/Diary Entry" },

// 	// Persuasive / Directive
// 	{ key: "pitch", label: "Pitch" },
// 	{ key: "appeal", label: "Appeal" },
// 	{ key: "campaign_speech", label: "Campaign Speech" },
// 	{ key: "instruction_demo", label: "Instruction/Demo" },

// 	// Informal (solo style)
// 	{ key: "rant", label: "Rant" },
// 	{ key: "podcast_solo", label: "Podcast (Solo)" },
// ];

const MAX_DURATION = 15 * 60;


const RecordingPage = () => {
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
		isLoading,
		error
	} = useRecording();

	const eyeAndHeadConfidence = useRef({ sum: 0, count: 0 })
	const [feedback, setFeedback] = useState<FeedbackCounts>(initialFeedbackCounts);
	const frame = useRef<number>(0);
	const [isUploading, setIsUploading] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);


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
				console.log("MediaRecorder stopped, exporting...");
				console.log("Feedback: ", feedback);

				setIsProcessing(true);

				await exportWavFromRecording(recordedChunksRef.current, async (wavBlob) => {
					try {
						setIsProcessing(false);
						setIsUploading(true);

						// Transform posture data to match backend schema
						const transformedPostureData = transformPostureDataForBackend(feedback);
						console.log("Uploading with posture data:", transformedPostureData);

						// Create a file from the blob
						const audioFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });

						// Upload to backend with posture features and progress tracking
						await uploadAudio(
							currentRecording.id,
							audioFile,
							transformedPostureData,
						);

						console.log("✅ Recording uploaded successfully!");
					} catch (error) {
						console.error("❌ Failed to upload recording:", error);
					} finally {
						setIsProcessing(false);
						setIsUploading(false);
					}
				});
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
			<div className="w-full h-full flex p-12 gap-12">

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
						<Select key={selectKey} aria-label='Select domain' disabled={isRecording} value={data.domain} variant='faded' placeholder="Select a domain" className="w-full *:text-highlight" onSelectionChange={(e) => setData({ ...data, domain: e.currentKey })}>
							{domains.map((type) => (
								<SelectItem className='text-highlight' textValue={type.label} key={type.id}>{type.label}</SelectItem>
							))}
						</Select>
					</div>

					{/* Record Button */}
					<div className="flex flex-col items-center gap-5">
						<RecordingTimerCircle visible={isRecording} duration={MAX_DURATION} elapsed={elapsedTime}>
							<button
								onClick={isRecording ? stopRecording : startRecording}
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
								<Spinner className='size-6 text-yellow-500' />
								<p className='text-yellow-600 text-sm font-medium'>Processing audio...</p>
							</div>
						)}

						{/* Upload Status */}
						{!isProcessing && isUploading && (
							<div className='flex flex-col items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
								<Spinner className='size-6 text-primary' />
								<p className='text-primary text-sm font-medium'>Uploading recording...</p>
							</div>
						)}

						{/* Error Display */}
						{error && (
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
		</>
	);
};

export default RecordingPage;
