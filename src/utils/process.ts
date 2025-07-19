import { analyzeEyeContactAndHeadPose, analyzeHandGestures, analyzeHeadAlignment, analyzeShoulderAlignment } from "@/hooks/postureAnalysis";
import { updateFeedbackType } from "@/types/feedback.types";

export const updateFeedback = ({frame, analyze, feedback, setFeedback, webcamRef, eyeAndHeadConfidence} : updateFeedbackType) => {
	const interval = setInterval(async () => {

		const video = webcamRef.current?.video;
		if (!video || video.readyState !== 4) return null;

		frame.current += 1; // <-- Increment frame index
		const timestamp = frame.current; // <-- Use frame index as timestamp
		const result = await analyze(video, timestamp);
		if (!result) return;

		const updatedFeedback = { ...feedback };

		const faceLandmarks = result.face?.faceLandmarks;
		const poseLandmarks = result.pose?.landmarks?.[0];
		const handLandmarks = result.hand?.landmarks || [];

		let eyeAndHeadFeedback = { feedback: "", confidence: 0 }
		let shoulderFeedback = "";
		let handsFeedback = "";
		let headAlignment = "";

		// Setting all the feedbacks
		if (faceLandmarks) {
			headAlignment = analyzeHeadAlignment(faceLandmarks?.[0]);
			eyeAndHeadFeedback = analyzeEyeContactAndHeadPose(faceLandmarks, Number(webcamRef.current?.props.height), Number(webcamRef.current?.props.width))
		} else {
			eyeAndHeadFeedback = { feedback: "No face detected", confidence: 0 }
		}

		if (poseLandmarks) {
			shoulderFeedback = analyzeShoulderAlignment(poseLandmarks);
		} else {
			shoulderFeedback = 'Shoulders not detected';
		}

		if (handLandmarks) {
			handsFeedback = analyzeHandGestures(handLandmarks, faceLandmarks);
		} else {
			handsFeedback = 'Hands not detected';
		}

		// Setting the updated feedback
		// First shoulder alignment
		if (!updatedFeedback.shoulderAlignment[shoulderFeedback]) {
			updatedFeedback.shoulderAlignment[shoulderFeedback] = 1;
		} else { updatedFeedback.shoulderAlignment[shoulderFeedback] += 1; }

		// Next hands feedback
		if (!updatedFeedback.handGestures[handsFeedback]) {
			updatedFeedback.handGestures[handsFeedback] = 1;
		} else { updatedFeedback.handGestures[handsFeedback] += 1; }

		// Next feedback on head alignment with body
		if (!updatedFeedback.headBodyAlignment[headAlignment]) {
			updatedFeedback.headBodyAlignment[headAlignment] = 1;
		} else { updatedFeedback.headBodyAlignment[headAlignment] += 1; }

		// Finally eye contact and head posture feedback and confidence score
		eyeAndHeadConfidence.current.sum += eyeAndHeadFeedback.confidence ? eyeAndHeadFeedback.confidence : 0;
		eyeAndHeadConfidence.current.count += 1;
		updatedFeedback.eyeContact['Confidence score'] = (eyeAndHeadConfidence.current.sum / eyeAndHeadConfidence.current.count)

		if (!updatedFeedback.eyeContact[eyeAndHeadFeedback.feedback]) {
			updatedFeedback.eyeContact[eyeAndHeadFeedback.feedback] = 1;
		} else { updatedFeedback.eyeContact[eyeAndHeadFeedback.feedback] += 1; }

		setFeedback(updatedFeedback);
	}, 500);

	return interval;

}