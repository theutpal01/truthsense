const EAR_THRESHOLD = 0.2;
const COSINE_THRESHOLD = 0.9  // Cosine similarity threshold for gaze direction
const LEFT_EYE_EAR_POINTS = { top: 159, bottom: 145, left: 33, right: 133 };
const RIGHT_EYE_EAR_POINTS = { top: 386, bottom: 374, left: 362, right: 263 };
const LEFT_EYE_CIRCLE_POINTS = { left_corner: 130, right_corner: 133, top: 223, bottom: 23 };
const RIGHT_EYE_CIRCLE_POINTS = { left_corner: 362, right_corner: 359, top: 443, bottom: 253 };
const IRIS_CENTERS: [number, number] = [468, 473];    // Left iris center, right iris center
const GAZE_CALC_IDXS: [number, number] = [33, 263];   // Left eye point, right eye point

// Adjusting radius multiplier based on screen size
let screenWidth = 1920; // fallback
let screenHeight = 1080;

if (typeof window !== "undefined") {
	screenWidth = window.screen.width;
	screenHeight = window.screen.height;
}

let RADIUS_MULTIPLIER = 0.2;    // For a 16-inch laptop
if (screenWidth < 1920 && screenHeight < 1200) {
	RADIUS_MULTIPLIER = 0.15;     // For a 14-inch laptop
}


// Helper: Euclidean distance
function euclidean(a: { x: number, y: number }, b: { x: number, y: number }) {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

function calculateEAR(landmarks: { x: number, y: number }[], points: { top: number, bottom: number, left: number, right: number }) {
	const top = landmarks[points.top];
	const bottom = landmarks[points.bottom];
	const left = landmarks[points.left];
	const right = landmarks[points.right];

	if (!top || !bottom || !left || !right) {
		return 0;
	}

	const verticalDist = euclidean(top, bottom);
	const horizontalDist = euclidean(left, right);

	return horizontalDist === 0 ? 0 : verticalDist / horizontalDist;
}

function getGazeVector(landmarks: Array<{ x: number, y: number }>, width: number, height: number) {
	function vectorBetween(cornerIdx: number, irisIdx: number) {
		const cornerLandmark = landmarks[cornerIdx];
		const irisLandmark = landmarks[irisIdx];
		if (!cornerLandmark || !irisLandmark) {
			return { x: 0, y: 0 };
		}
		const corner = { x: cornerLandmark.x * width, y: cornerLandmark.y * height };
		const iris = { x: irisLandmark.x * width, y: irisLandmark.y * height };
		const vec = { x: iris.x - corner.x, y: iris.y - corner.y };
		const norm = Math.hypot(vec.x, vec.y);
		return norm === 0 ? { x: 0, y: 0 } : { x: vec.x / norm, y: vec.y / norm };
	}

	const leftVector = vectorBetween(GAZE_CALC_IDXS[0], IRIS_CENTERS[0]);
	const rightVector = vectorBetween(GAZE_CALC_IDXS[1], IRIS_CENTERS[1]);
	const avgVector = { x: (leftVector.x + rightVector.x) / 2, y: (leftVector.y + rightVector.y) / 2 };
	const normAvgVector = Math.hypot(avgVector.x, avgVector.y);

	return normAvgVector === 0 ? { x: 0, y: 0 } : { x: avgVector.x / normAvgVector, y: avgVector.y / normAvgVector };
}

function getEyeCircleInfo(
	landmarks: Array<{ x: number, y: number }>,
	points: { left_corner: number, right_corner: number, top: number, bottom: number },
	width: number,
	height: number,
	alpha: number = 0.65
) {
	const topLandmark = landmarks[points.top];
	const bottomLandmark = landmarks[points.bottom];
	const leftCornerLandmark = landmarks[points.left_corner];
	const rightCornerLandmark = landmarks[points.right_corner];

	if (!topLandmark || !bottomLandmark || !leftCornerLandmark || !rightCornerLandmark) {
		return { center: { x: 0, y: 0 }, radius: 0 };
	}

	const topY = topLandmark.y * height;
	const bottomY = bottomLandmark.y * height;
	const radius = Math.abs(bottomY - topY) * RADIUS_MULTIPLIER;

	const y = (1 - alpha) * topY + alpha * bottomY;
	const x = ((leftCornerLandmark.x + rightCornerLandmark.x) / 2) * width;
	return { center: { x, y }, radius };
}

function isInsideCircle(center: { x: number, y: number }, point: { x: number, y: number }, radius: number) {
	return euclidean(center, point) <= radius;
}

function getIrisInBounds(
	landmarks: Array<{ x: number, y: number }>,
	width: number,
	height: number
) {
	// Left eye
	const leftEyeDetails = getEyeCircleInfo(landmarks, LEFT_EYE_CIRCLE_POINTS, width, height);
	const leftIrisLandmark = landmarks[IRIS_CENTERS[0]];

	if (!leftIrisLandmark) {
		return {
			leftIn: false,
			rightIn: false,
			leftCircle: leftEyeDetails,
			rightCircle: { center: { x: 0, y: 0 }, radius: 0 },
			leftIris: { x: 0, y: 0 },
			rightIris: { x: 0, y: 0 }
		};
	}

	const leftIris = {
		x: Number((leftIrisLandmark.x * width).toFixed(0)),
		y: Number((leftIrisLandmark.y * height).toFixed(0))
	};
	const leftIn = isInsideCircle(leftEyeDetails.center, leftIris, leftEyeDetails.radius);

	// Right eye
	const rightEyeDetails = getEyeCircleInfo(landmarks, RIGHT_EYE_CIRCLE_POINTS, width, height);
	const rightIrisLandmark = landmarks[IRIS_CENTERS[1]];

	if (!rightIrisLandmark) {
		return {
			leftIn,
			rightIn: false,
			leftCircle: leftEyeDetails,
			rightCircle: rightEyeDetails,
			leftIris,
			rightIris: { x: 0, y: 0 }
		};
	}

	const rightIris = {
		x: rightIrisLandmark.x * width,
		y: rightIrisLandmark.y * height
	};
	const rightIn = isInsideCircle(rightEyeDetails.center, rightIris, rightEyeDetails.radius);

	return {
		leftIn,
		rightIn,
		leftCircle: leftEyeDetails,
		rightCircle: rightEyeDetails,
		leftIris,
		rightIris
	};
}

export function analyzeEyeContactAndHeadPose(
	faceLandmarks: Array<Array<{ x: number; y: number }>> | null,
	height: number, width: number): { feedback: string; confidence: number } {
	console.log(faceLandmarks)
	if (!faceLandmarks || !faceLandmarks[0]) {
		return { feedback: "No face detected", confidence: 0 };
	}
	const landmarks = faceLandmarks[0];
	const gazeVector = getGazeVector(landmarks, width, height);

	// Reference gaze calibration (persisted in sessionStorage)
	function getReferenceGaze(): number[] | null {
		const ref = sessionStorage.getItem('referenceGaze');
		return ref ? JSON.parse(ref) : null;
	}
	function setReferenceGaze(vec: number[]) {
		sessionStorage.setItem('referenceGaze', JSON.stringify(vec));
	}

	// If reference gaze exists, then calibration has already been done
	let referenceGaze = getReferenceGaze();
	if (!referenceGaze) {
		setReferenceGaze([gazeVector.x, gazeVector.y]);   // Setting reference vector to current gaze vector if no calibration done
		referenceGaze = [gazeVector.x, gazeVector.y];
		return { feedback: "Eye contact maintained; Head centered", confidence: 1 }
	}
	// --- Gaze vector alignment (cosine similarity) ---
	const dot = (referenceGaze && referenceGaze[0] !== undefined && referenceGaze[1] !== undefined)
		? gazeVector.x * referenceGaze[0] + gazeVector.y * referenceGaze[1]
		: 0;
	const norm1 = Math.hypot(gazeVector.x, gazeVector.y);
	const norm2 = referenceGaze
		? Math.hypot(referenceGaze[0] ?? 0, referenceGaze[1] ?? 0)
		: 0;
	const cosine = norm1 && norm2 ? dot / (norm1 * norm2) : 0;
	const gazeVectorAligned = cosine > COSINE_THRESHOLD;

	const irisBounds = getIrisInBounds(landmarks, width, height);
	const irisInBounds = irisBounds.leftIn && irisBounds.rightIn;

	const leftEAR = calculateEAR(landmarks, LEFT_EYE_EAR_POINTS);
	const rightEAR = calculateEAR(landmarks, RIGHT_EYE_EAR_POINTS);
	const isBlinking = leftEAR < EAR_THRESHOLD && rightEAR < EAR_THRESHOLD;

	let feedback = "";
	let confidence = 0;

	if (isBlinking) {
		feedback = "Blinking / Eyes closed";
		confidence = 0;
	} else if (irisInBounds && gazeVectorAligned) {
		feedback = "Eye contact maintained; Head centered";
		// Python: confidence_gaze_component = (dot_product - threshold) / (1.0 - threshold)
		const headConfidence = (cosine - COSINE_THRESHOLD) / (1.0 - COSINE_THRESHOLD);
		confidence = (1 + Math.max(0, Math.min(1, headConfidence))) / 2;

	} else if (irisInBounds || gazeVectorAligned) {
		// Lower confidence if only one is true
		const headConfidence = (cosine - COSINE_THRESHOLD) / (1.0 - COSINE_THRESHOLD);
		confidence = Math.max(0, Math.min(0.5, headConfidence));
		feedback = (gazeVectorAligned ? "Eye contact not maintained; Head centered" : "Eye contact maintained wrt head position but head tilted away from the screen");
	} else {
		feedback = "Eyes off-center; head tilted away from the screen";
		confidence = 0;
	}

	return {
		feedback,
		confidence,
	};
}

export function analyzeShoulderAlignment(landmarks: Array<{ x: number, y: number }>) {
	// console.log(landmarks);
	const leftShoulder = landmarks[11];
	const rightShoulder = landmarks[12];

	if (!leftShoulder || !rightShoulder) {
		return "Shoulder landmarks not detected";
	}

	const shoulderSlope = Math.abs(leftShoulder.y - rightShoulder.y);

	if (shoulderSlope < 0.05) { return "Shoulders well aligned"; }
	else if (shoulderSlope > 0.1) { return "Shoulders are tilted"; }
	return "Shoulders slightly tilted";
}

export function analyzeHeadAlignment(landmarks: Array<{ x: number, y: number }>) {
	const nose = landmarks[0];
	const leftShoulder = landmarks[11];
	const rightShoulder = landmarks[12];

	if (!nose || !leftShoulder || !rightShoulder) {
		return "Head or shoulder landmarks not detected";
	}

	const shoulderCenter = (leftShoulder.y + rightShoulder.y) / 2;
	const alignment = Math.abs(nose.x - shoulderCenter);

	if (alignment < 0.03) { return "Head properly aligned with body"; }
	if (alignment > 0.06) { return "Head not centered over shoulders"; }
	return "Head slightly tilted";
}

export function analyzeHandGestures(handLandmarks: Array<Array<{ x: number, y: number }>> | Array<{ x: number, y: number }>) {
	let feedback = "";
	if (handLandmarks.length === 0) { feedback += "Hands not in frame"; }
	else if (handLandmarks.length === 1) {
		feedback += "One hand in frame; ";

		let wrist: { x: number, y: number };
		if (Array.isArray(handLandmarks[0])) {
			wrist = (handLandmarks[0] as Array<{ x: number, y: number }>)[0] ?? { x: 0, y: 0 };
		} else {
			wrist = handLandmarks[0] as { x: number, y: number };
		}

		if (wrist.y < 0.3) { feedback += "Hand too high up in the frame"; }
		else if (wrist.y > 0.8) { feedback += "Hand too low in the frame"; }
		else { feedback += "Hand in the correct area for gesturing" }
	}
	else {
		feedback += "Both hands visible through the camera";

		let wrist1: { x: number, y: number } | undefined;
		let wrist2: { x: number, y: number } | undefined;

		if (Array.isArray(handLandmarks[0])) {
			wrist1 = (handLandmarks[0] as Array<{ x: number, y: number }>)[0];
			wrist2 = (handLandmarks[1] as Array<{ x: number, y: number }>)[0];
		}

		if (wrist1 && wrist1.y < 0.3) { feedback += "One hand too high; "; }
		else if (wrist1 && wrist1.y > 0.8) { feedback += "One hand too low; "; }

		if (wrist2 && wrist2.y < 0.3) { feedback += "the other too high"; }
		else if (wrist2 && wrist2.y > 0.8) { feedback += "the other too low"; }

		if (
			wrist1 && wrist2 &&
			(wrist1.y > 0.3 && wrist1.y < 0.8) && (wrist2.y > 0.3 && wrist2.y < 0.8)
		) { feedback += "Both hands in visible region for gesturing"; }
		if (
			(wrist1 && wrist1.y > 0.3 && wrist1.y < 0.8) ||
			(wrist2 && wrist2.y > 0.3 && wrist2.y < 0.8)
		) { feedback += "One hand in visible region for gesturing"; }
	}

	return feedback;
}