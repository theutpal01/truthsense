// src/utils/feedbackTypes.ts

import { FaceLandmarkerResult, HandLandmarkerResult, PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import { Dispatch, RefObject, SetStateAction } from "react";
import Webcam from "react-webcam";

export interface FeedbackCounts {
	eyeContact: Record<string, number>;
	shoulderAlignment: Record<string, number>;
	headBodyAlignment: Record<string, number>;
	handGestures: Record<string, number>;

	// Optional just for here, we are not going to tamper with this in our files
	props?: Array<string> | ["eyeContact", "shoulderAlignment", "headBodyAlignment", "handGestures"]
}

export interface updateFeedbackType {
	frame: RefObject<number>;
	analyze: (video: HTMLVideoElement, timestamp: number) => Promise<
		{ pose: null, face: null, hand: null } |
		{pose: PoseLandmarkerResult, face: FaceLandmarkerResult, hand: HandLandmarkerResult}
	>;
	feedback: FeedbackCounts;
	setFeedback: Dispatch<SetStateAction<FeedbackCounts>>;
	webcamRef: RefObject<Webcam | null>;
	eyeAndHeadConfidence: RefObject<{sum: number, count: number}>

}

export const initialFeedbackCounts: FeedbackCounts = {
	eyeContact: {},
	shoulderAlignment: {},
	headBodyAlignment: {},
	handGestures: {},
};