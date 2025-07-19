import { Button, Select, SelectItem } from '@heroui/react';
import React, { useRef, useEffect, useState } from 'react';
import { AnimatedWave } from './animated-wave';
import { PiStopFill } from 'react-icons/pi';
import Webcam from 'react-webcam';
import { exportWavFromRecording } from '@/utils/audio';
import { usePostureAnalyzer } from '@/hooks/usePostureAnalyzer';
import { FeedbackCounts, initialFeedbackCounts } from '@/types/feedback.types';
import { updateFeedback } from '@/utils/process';


const soloCommunicationTypes = [
	// Formal/Professional (solo types only)
	{ key: "interview", label: "Interview" },
	{ key: "speech", label: "Speech" },
	{ key: "presentation", label: "Presentation" },
	{ key: "lecture", label: "Lecture" },
	{ key: "briefing", label: "Briefing" },
	{ key: "conference_talk", label: "Conference Talk" },

	// Creative / Performative
	{ key: "monologue", label: "Monologue" },
	{ key: "poetry_recital", label: "Poetry Recital" },
	{ key: "spoken_word", label: "Spoken Word" },
	{ key: "improv", label: "Improv" }, // solo improv sessions
	{ key: "storytelling", label: "Storytelling" },

	// Analytical / Reflective
	{ key: "think_aloud", label: "Think-Aloud" },
	{ key: "self_talk", label: "Self-Talk" },
	{ key: "vlog_entry", label: "Vlog/Diary Entry" },

	// Persuasive / Directive
	{ key: "pitch", label: "Pitch" },
	{ key: "appeal", label: "Appeal" },
	{ key: "campaign_speech", label: "Campaign Speech" },
	{ key: "instruction_demo", label: "Instruction/Demo" },

	// Informal (solo style)
	{ key: "rant", label: "Rant" },
	{ key: "podcast_solo", label: "Podcast (Solo)" },
];



const RecordingPage = () => {
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

	const eyeAndHeadConfidence = useRef({ sum: 0, count: 0 })
	const [feedback, setFeedback] = useState<FeedbackCounts>(initialFeedbackCounts);
	const frame = useRef<number>(0);


	const startRecording = () => {
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
		} else {
			console.error("No valid MediaStream found for recording.");
			setIsRecording(false);
		}
	};

	const stopRecording = () => {
		if (!mediaRecorderRef.current) return;

		setIsRecording(false);

		mediaRecorderRef.current.onstop = async () => {
			console.log("MediaRecorder stopped, exporting...");

			await exportWavFromRecording(recordedChunksRef.current);
		};
		mediaRecorderRef.current.stop();
		console.log("MediaRecorder stop called.");

	};


	const resetRecording = () => {
		if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
			mediaRecorderRef.current.onstop = () => {
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


	return (
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
						{soloCommunicationTypes.map((type) => (
							<SelectItem className='text-highlight' textValue={type.label} key={type.key}>{type.label}</SelectItem>
						))}
					</Select>
				</div>

				{/* Record Button */}
				<div className="flex flex-col items-center gap-5">
					<button
						onClick={isRecording ? stopRecording : startRecording}
						disabled={!data.domain || isRecording == null}
						className={`w-[150px] h-[150px] rounded-full bg-record-btn shadow-lg flex items-center justify-center ${data.domain != undefined ? 'cursor-pointer' : ''} transition-transform`}
					>
						<AnimatedWave isPlaying={isRecording} disabled={!data.domain} />
					</button>
					<p className="text-text">
						{data.domain != undefined ? (!isRecording ? `Start Recording` : `Finish Recording`) : "Select a domain to start recording"}
					</p>
				</div>

				<div className='flex flex-col gap-5'>
					{isRecording && <div className='flex flex-col items-center gap-1'>
						<Button isIconOnly variant='bordered' className='w-10 h-10' onClick={resetRecording}>
							<PiStopFill className='size-6 text-red-400' />
						</Button>
						<p className='text-text'>Retry Recording</p>
					</div>}


					{/* Tip */}
					<p className="text-[10px] text-gray-400 text-center">Tip: stay calm, relaxed & confident</p>
				</div>
			</div>
		</div>
	);
};

export default RecordingPage;
