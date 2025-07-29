import {
	analyzeEyeContactAndHeadPose,
	analyzeHandGestures,
	analyzeHeadAlignment,
	analyzeShoulderAlignment,
} from "@/hooks/postureAnalysis";
import { updateFeedbackType } from "@/types/feedback.types";

export const updateFeedback = ({
	frame,
	analyze,
	feedback,
	setFeedback,
	webcamRef,
	eyeAndHeadConfidence,
}: updateFeedbackType) => {
	const interval = setInterval(async () => {
		const webcam = webcamRef?.current;
		const video = webcam?.video;

		if (!video || video.readyState !== 4) return null;

		frame.current += 1;
		const timestamp = frame.current;
		const result = await analyze(video, timestamp);
		if (!result) return;

		// 🛠️ Ensure sub-objects are initialized to avoid undefined access
		const updatedFeedback = {
			shoulderAlignment: { ...feedback.shoulderAlignment },
			handGestures: { ...feedback.handGestures },
			headBodyAlignment: { ...feedback.headBodyAlignment },
			eyeContact: { ...feedback.eyeContact },
		};

		const faceLandmarks = result.face?.faceLandmarks;
		const poseLandmarks = result.pose?.landmarks?.[0];
		const handLandmarks = result.hand?.landmarks || [];

		let eyeAndHeadFeedback = { feedback: "", confidence: 0 };
		let shoulderFeedback = "";
		let handsFeedback = "";
		let headAlignment = "";

		// ✅ Safe parsing of face data
		if (faceLandmarks && faceLandmarks.length > 0) {
			// @ts-expect-error: Expect ts error for now
			headAlignment = analyzeHeadAlignment(faceLandmarks[0]);

			eyeAndHeadFeedback = analyzeEyeContactAndHeadPose(
				faceLandmarks,
				Number(webcam?.props?.height ?? 0),
				Number(webcam?.props?.width ?? 0)
			);
		} else {
			eyeAndHeadFeedback = { feedback: "No face detected", confidence: 0 };
		}

		// ✅ Pose landmarks
		if (poseLandmarks) {
			shoulderFeedback = analyzeShoulderAlignment(poseLandmarks);
		} else {
			shoulderFeedback = "Shoulders not detected";
		}

		// ✅ Hand landmarks
		if (Array.isArray(handLandmarks) && handLandmarks.length > 0) {
			handsFeedback = analyzeHandGestures(handLandmarks);
		} else {
			handsFeedback = "Hands not detected";
		}

		// ✅ Update feedback counts safely
		updatedFeedback.shoulderAlignment[shoulderFeedback] =
			(updatedFeedback.shoulderAlignment[shoulderFeedback] || 0) + 1;

		updatedFeedback.handGestures[handsFeedback] =
			(updatedFeedback.handGestures[handsFeedback] || 0) + 1;

		updatedFeedback.headBodyAlignment[headAlignment] =
			(updatedFeedback.headBodyAlignment[headAlignment] || 0) + 1;

		// ✅ Eye contact feedback & confidence
		if (eyeAndHeadConfidence?.current) {
			eyeAndHeadConfidence.current.sum += eyeAndHeadFeedback.confidence ?? 0;
			eyeAndHeadConfidence.current.count += 1;

			const confidenceScore =
				eyeAndHeadConfidence.current.sum / eyeAndHeadConfidence.current.count;

			updatedFeedback.eyeContact["Confidence score"] = confidenceScore;
		}

		updatedFeedback.eyeContact[eyeAndHeadFeedback.feedback] =
			(updatedFeedback.eyeContact[eyeAndHeadFeedback.feedback] || 0) + 1;

		setFeedback(updatedFeedback);
	}, 500);

	return interval;
};


export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));