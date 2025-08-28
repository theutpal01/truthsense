// src/hooks/usePostureAnalyzer.ts
import {
	FilesetResolver,
	PoseLandmarker,
	FaceLandmarker,
	HandLandmarker,
} from '@mediapipe/tasks-vision';

import { useRef } from 'react';

export const usePostureAnalyzer = () => {
	const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
	const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
	const handLandmarkerRef = useRef<HandLandmarker | null>(null);
	const initializedRef = useRef(false);

	const init = async () => {
		if (initializedRef.current) return; // Prevent re-initialization

		const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");

		poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
			baseOptions: { modelAssetPath: '/models/pose_landmarker.task' },
			runningMode: "VIDEO",
			numPoses: 1,
			minPoseDetectionConfidence: 0.5,
			minPosePresenceConfidence: 0.5,
			minTrackingConfidence: 0.5,
		});

		faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
			baseOptions: { modelAssetPath: '/models/face_landmarker.task' },
			runningMode: "VIDEO",
			numFaces: 1,
			minFaceDetectionConfidence: 0.5,
			minFacePresenceConfidence: 0.5,
			minTrackingConfidence: 0.5,
		});

		handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
			baseOptions: { modelAssetPath: '/models/hand_landmarker.task' },
			runningMode: "VIDEO",
			numHands: 2,
			minHandDetectionConfidence: 0.5,
			minHandPresenceConfidence: 0.5,
			minTrackingConfidence: 0.5,
		});

		initializedRef.current = true;
	};

	const analyze = async (
		video: HTMLVideoElement,
		timestamp: number
	) => {
		if (!poseLandmarkerRef.current || !faceLandmarkerRef.current || !handLandmarkerRef.current) {
			return { pose: null, face: null, hand: null };
		}

		try {
			const pose = poseLandmarkerRef.current.detectForVideo(video, timestamp);
			const face = faceLandmarkerRef.current.detectForVideo(video, timestamp);
			const hand = handLandmarkerRef.current.detectForVideo(video, timestamp);
			return { pose, face, hand };
		} catch (error) {
			console.error('Error during analysis:', error);
			return { pose: null, face: null, hand: null };
		};
		return { pose, face, hand };
	};

	return { init, analyze };
};