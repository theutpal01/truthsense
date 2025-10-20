/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button, Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import Meter from "@/components/feedback/Meter";
import ScoreCard from "@/components/feedback/ScoreCard";
import ScrollDiv from "@/components/ui/scroll-div";
import WordsMeter from "@/components/feedback/WordsMeter";
import { recordingService } from "@/services/recording.service";
import type { Recording, RecordingAnalysis } from "@/types/recording.types";
import { FaDownload } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { changeCategoryCase } from "@/utils/process.utils";

interface ReportProps {
	id: string;
}

const Report = ({ id }: ReportProps) => {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [recording, setRecording] = useState<Recording | null>(null);
	const [analysisData, setAnalysisData] = useState<RecordingAnalysis | null>(null);
	const reportRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		loadAnalysis();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const loadAnalysis = async () => {
		setLoading(true);
		setError(null);

		try {
			// Fetch recording with analysis
			const result = await recordingService.getRecording(id);

			if (!result.success) {
				throw new Error(result.message || 'Failed to load analysis');
			}

			if (result.status === 'processing') {
				setError('Analysis is still being processed. Please check back in a moment.');
				// Optionally, you could poll here
				setTimeout(loadAnalysis, 5000);
				return;
			}

			if (result.status === 'failed') {
				throw new Error('Recording processing failed');
			}

			setAnalysisData(result);

			// Also fetch full recording details if needed
			const recordings = await recordingService.getUserRecordings();
			const recordingDetail = recordings.find(r => r.id === id);
			if (recordingDetail) {
				setRecording(recordingDetail);
			}

			console.log("📊 Analysis data:", result);
		} catch (err: any) {
			console.error("❌ Fetch error:", err);
			setError(err.message || 'Failed to load analysis');
		} finally {
			setLoading(false);
		}
	};

	const handleDownloadPDF = async () => {
		if (!reportRef.current) return;

		try {
			// Dynamically import html2pdf to avoid SSR issues
			const html2pdf = (await import('html2pdf.js')).default;

			html2pdf()
				.from(reportRef.current)
				.set({
					margin: 0.5,
					filename: `Report-${id}.pdf`,
					image: { type: "jpeg", quality: 0.98 },
					html2canvas: { scale: 2 },
					jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
				})
				.save();
		} catch (err) {
			console.error("Failed to download PDF:", err);
			setError("Failed to download PDF. Please try again.");
		}
	};

	const handleDownloadAudio = async () => {
		try {
			const blob = await recordingService.downloadRecording(id);
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `recording-${id}.webm`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err: any) {
			console.error("Failed to download audio:", err);
			setError(err.message || "Failed to download audio");
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-4">
				<Spinner size="lg" color="primary" />
				<p className="text-muted">Loading analysis...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-4">
				<div className="text-center max-w-md">
					<div className="text-6xl mb-4">⚠️</div>
					<h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
					<p className="text-muted mb-4">{error}</p>
					<div className="flex gap-3 justify-center">
						<Button
							onClick={loadAnalysis}
							className="bg-primary text-white hover:bg-primary-hover"
						>
							Retry
						</Button>
						<Button
							onClick={() => router.push('/history')}
							variant="bordered"
						>
							Back to History
						</Button>
					</div>
				</div>
			</div>
		);
	}

	if (!analysisData?.analysis) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-4">
				<div className="text-center max-w-md">
					<div className="text-6xl mb-4">📊</div>
					<h2 className="text-2xl font-bold text-text mb-2">No Analysis Available</h2>
					<p className="text-muted mb-4">Analysis data is not available for this recording.</p>
					<Button
						onClick={() => router.push('/history')}
						className="bg-primary text-white hover:bg-primary-hover"
					>
						Back to History
					</Button>
				</div>
			</div>
		);
	}

	// Extract analysis data with type safety
	const data = analysisData.analysis as any; // Type this properly based on your analysis structure

	return (
		<div className="relative font-lato mx-auto px-8 py-10">
			<div ref={reportRef} className="flex flex-col gap-10">
				{/* Header Card */}
				<Card className="flex flex-row items-center justify-between bg-card w-full p-5">
					<div className="flex flex-col">
						<h2 className="text-2xl font-bold mb-1 text-primary">
							<span className="font-medium">Category: </span>
							{changeCategoryCase(recording?.domain) || changeCategoryCase(data.info?.category) || 'N/A'}
						</h2>
						<p className="text-muted">
							Report generated on: {recording?.createdAt
								? new Date(recording.createdAt).toDateString()
								: new Date().toDateString()
							}
						</p>
						{recording && (
							<p className="text-muted text-sm mt-1">
								Duration: {Math.floor(recording.duration / 60)}m {recording.duration % 60}s
							</p>
						)}
					</div>
					<div className="flex gap-2">
						<Button
							onClick={handleDownloadAudio}
							isIconOnly={true}
							variant="bordered"
							className="w-12 h-12 text-primary hover:bg-primary/10"
							title="Download Audio"
						>
							🎵
						</Button>
						<Button
							onClick={handleDownloadPDF}
							isIconOnly={true}
							className="active-sidebar-btn w-12 h-12 text-primary hover:bg-primary-dark"
							title="Download PDF"
						>
							<FaDownload className="size-5" />
						</Button>
					</div>
				</Card>

				{/* Overall Score */}
				<div className="flex items-start justify-between">
					<ScoreCard percent={data.overall_score || 0} />
					<div className="flex flex-wrap justify-end gap-5">
						<Meter
							type="fluency"
							score={data.fluency_evaluator?.fluency_score || 0}
						/>
						<Meter
							type="clarity"
							score={data.speech_evaluator?.clarity_score || 0}
						/>
						<Meter
							type="grammar"
							score={data.language_evaluator?.grammar_score || 0}
						/>
						<Meter
							type="confidence"
							score={data.speech_evaluator?.confidence_score || 0}
						/>
						<Meter
							type="posture"
							score={data.posture_evaluator?.score || 0}
						/>
						<Meter
							type="structure"
							score={data.language_evaluator?.structure_score || 0}
						/>
					</div>
				</div>

				{/* Summary & WPM */}
				<div className="flex gap-5">
					<Card className="w-full bg-card h-80 overflow-auto p-5">
						<CardHeader className="font-medium text-lg">Transcript</CardHeader>
						<CardBody>
							<p className="text-base text-text whitespace-pre-wrap">
								{data.transcript || 'No transcript available'}
							</p>
						</CardBody>
					</Card>
					<WordsMeter wpm={data.speaking_rate || 0} />
				</div>

				{/* Evaluation Section */}
				<div className="flex gap-5">
					<ScrollDiv heading="Fluency Evaluation" className="w-1/2">
						<p>{data.fluency_evaluator?.comment || 'No fluency evaluation available'}</p>
					</ScrollDiv>

					<ScrollDiv heading="Posture Evaluation" className="w-1/2">
						{data.posture_evaluator?.tips && data.posture_evaluator.tips.length > 0 ? (
							<ul>
								{data.posture_evaluator.tips.map((point: string, index: number) => (
									<li key={index} className="list-disc list-inside">{point}</li>
								))}
							</ul>
						) : (
							<p>No posture evaluation available</p>
						)}
					</ScrollDiv>
				</div>

				{/* Language Coach */}
				<Card className="bg-card w-full h-96 overflow-auto p-5">
					<CardHeader className="font-medium text-lg">Language Coach</CardHeader>
					<CardBody className="grid grid-cols-2 gap-5">
						<Card className="flex flex-col p-3 bg-success shadow-sm">
							<CardHeader>
								<h4 className="font-medium text-lg text-success">What went well</h4>
							</CardHeader>
							<CardBody>
								{data.language_evaluator?.strengths && data.language_evaluator.strengths.length > 0 ? (
									<ul className="list-disc list-inside">
										{data.language_evaluator.strengths.map((t: any, i: number) => (
											<li key={i} className="list-none">
												🟢 {t}
											</li>
										))}
									</ul>
								) : (
									<p className="text-muted">No strengths recorded</p>
								)}
							</CardBody>
						</Card>
						<Card className="flex flex-col p-3 bg-error shadow-sm">
							<CardHeader>
								<h4 className="font-medium text-lg text-error">Areas of improvement</h4>
							</CardHeader>
							<CardBody>
								{data.language_evaluator?.improvements && data.language_evaluator.improvements.length > 0 ? (
									<ul className="list-disc list-inside">
										{data.language_evaluator.improvements.map((t: any, i: number) => (
											<li key={i} className="list-none">
												🔴 {t}
											</li>
										))}
									</ul>
								) : (
									<p className="text-muted">No improvements noted</p>
								)}
							</CardBody>
						</Card>
					</CardBody>
				</Card>

				{/* Speech Evaluator */}
				<Card className="bg-card w-full h-96 overflow-auto p-5">
					<CardHeader className="font-medium text-lg">Speech Evaluator</CardHeader>
					<CardBody className="grid grid-cols-2 gap-5">
						<Card className="flex flex-col p-3 bg-success shadow-sm">
							<CardHeader>
								<h4 className="font-medium text-lg text-success">What went well</h4>
							</CardHeader>
							<CardBody>
								{data.speech_evaluator?.strengths && data.speech_evaluator.strengths.length > 0 ? (
									<ul className="list-disc list-inside">
										{data.speech_evaluator.strengths.map((t: any, i: number) => (
											<li key={i} className="list-none">
												🟢 {t}
											</li>
										))}
									</ul>
								) : (
									<p className="text-muted">No strengths recorded</p>
								)}
							</CardBody>
						</Card>
						<Card className="flex flex-col p-3 bg-error shadow-sm">
							<CardHeader>
								<h4 className="font-medium text-lg text-error">Areas of improvement</h4>
							</CardHeader>
							<CardBody>
								{data.speech_evaluator?.improvements && data.speech_evaluator.improvements.length > 0 ? (
									<ul className="list-disc list-inside">
										{data.speech_evaluator.improvements.map((t: any, i: number) => (
											<li key={i} className="list-none">
												🔴 {t}
											</li>
										))}
									</ul>
								) : (
									<p className="text-muted">No improvements noted</p>
								)}
							</CardBody>
						</Card>
					</CardBody>
				</Card>

				{/* Recording Metadata (Optional) */}
				{recording && (
					<Card className="bg-card w-full p-5">
						<CardHeader className="font-medium text-lg">Recording Details</CardHeader>
						<CardBody className="grid grid-cols-3 gap-4 text-sm">
							<div>
								<p className="text-muted">Status</p>
								<p className="font-semibold capitalize">{recording.status}</p>
							</div>
							<div>
								<p className="text-muted">Recorded On</p>
								<p className="font-semibold">
									{new Date(recording.createdAt).toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-muted">File Size</p>
								<p className="font-semibold">
									{recording.audioFileSize
										? `${(recording.audioFileSize / 1024 / 1024).toFixed(2)} MB`
										: 'N/A'
									}
								</p>
							</div>
						</CardBody>
					</Card>
				)}
			</div>
		</div>
	);
};

export default Report;