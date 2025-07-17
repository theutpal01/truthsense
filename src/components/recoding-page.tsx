import React, { useRef, useEffect, useState } from 'react';

const RecordingPage = () => {
	const videoRef = useRef(null);
	const mediaRecorderRef = useRef(null);
	const [isRecording, setIsRecording] = useState(false);
	const [recordedChunks, setRecordedChunks] = useState([]);

	useEffect(() => {
		// Access the webcam
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
			videoRef.current.srcObject = stream;
		}).catch(err => {
			console.error("Error accessing media devices.", err);
		});
	}, []);

	const startRecording = () => {
		setRecordedChunks([]);
		setIsRecording(true);

		const stream = videoRef.current.srcObject;
		const mediaRecorder = new MediaRecorder(stream);
		mediaRecorderRef.current = mediaRecorder;

		mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				setRecordedChunks(prev => [...prev, event.data]);
			}
		};

		mediaRecorder.start();
	};

	const stopRecording = () => {
		mediaRecorderRef.current.stop();
		setIsRecording(false);
	};

	return (
			<div className="w-full h-full flex p-12 gap-12">

				{/* Video Section */}
				<div className="flex-1 rounded-xl overflow-hidden shadow-lg">
					<video ref={videoRef} autoPlay muted className=" scale-x-[-1] rounded-xl w-full h-full object-cover" />
				</div>

				{/* Sidebar Section */}
				<div className="flex flex-col justify-between w-full md:w-[250px] gap-4">
					{/* Question Bubble */}
					<div className="bg-white rounded-xl shadow-md p-4 border">
						<p className="text-teal-600 font-semibold text-lg">Tell me about yourself</p>
						<p className="text-gray-500 text-sm">short text</p>
					</div>

					{/* Record Button */}
					<div className="flex flex-col items-center gap-2">
						<button
							onClick={isRecording ? stopRecording : startRecording}
							className="w-[120px] h-[120px] rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-10 w-10 text-teal-700"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								{isRecording ? (
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								) : (
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-5 7 5v6l-7 5-7-5V10z" />
								)}
							</svg>
						</button>
						<p className="text-gray-700 text-sm">{isRecording ? 'Stop Recording' : 'Start Recording'}</p>
					</div>

					{/* Tip */}
					<p className="text-[10px] text-gray-400 text-center">Tip: stay calm, relaxed & confident</p>
				</div>
			</div>
	);
};

export default RecordingPage;
