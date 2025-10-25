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
import { toast } from "react-toastify";
import { FcVideoCall } from "react-icons/fc";
import { useTheme } from "@/contexts/ThemeContext";

interface ReportProps {
	id: string;
}

const Report = ({ id }: ReportProps) => {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [recording, setRecording] = useState<Recording | null>(null);
	const [analysisData, setAnalysisData] = useState<RecordingAnalysis | null>(null);
	const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
	const reportRef = useRef<HTMLDivElement>(null);
	const { theme } = useTheme();

	useEffect(() => {
		loadAnalysis();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const loadAnalysis = async () => {
		setLoading(true);
		setError(null);

		try {
			const result = await recordingService.getRecording(id);

			if (!result.success) {
				throw new Error(result.message || 'Failed to load analysis');
			}

			if (result.status === 'processing') {
				setError('Analysis is still being processed. Please check back in a moment.');
				setTimeout(loadAnalysis, 5000);
				return;
			}

			if (result.status === 'failed') {
				throw new Error('Recording processing failed');
			}

			setAnalysisData(result);

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


	// Util to expand all scrollable/overflow/width-constrained nodes recursively
	function expandAll(container: HTMLElement, originalStyles: Array<any>) {
		// Properties to override
		const props = ['overflow', 'overflowX', 'overflowY', 'maxHeight', 'height', 'maxWidth', 'width'];
		// Find all descendants
		container.querySelectorAll('.scrollable').forEach(el => {
			const node = el as HTMLElement;
			// Save original styles
			originalStyles.push({
				element: node,
				overflow: node.style.overflow,
				overflowX: node.style.overflowX,
				overflowY: node.style.overflowY,
				maxHeight: node.style.maxHeight,
				height: node.style.height,
				width: node.style.width,
				maxWidth: node.style.maxWidth
			});
			// Remove overflow and sizing for all nodes
			node.style.overflow = 'visible';
			node.style.overflowX = 'visible';
			node.style.overflowY = 'visible';
			node.style.maxHeight = 'none';
			node.style.maxWidth = 'none';
			node.style.height = 'auto';
			node.style.width = 'auto';
		});
	}


	const handleDownloadPDF = async () => {
		if (!reportRef.current || isDownloadingPDF) return;

		setIsDownloadingPDF(true);
		try {
			const jsPDF = (await import('jspdf')).default;
			const htmlToImage = await import('html-to-image');

			const element = reportRef.current;

			// Hide all elements with .no-print
			const noPrintEls = element.querySelectorAll('.no-print');
			noPrintEls.forEach((el) => (el as HTMLElement).style.display = 'none');

			// Remove all scrollbars/maxHeight restrictions
			const originalStyles: Array<{ element: Element; overflow: string; maxHeight: string; height: string; overflowX: string; overflowY: string; width: string; maxWidth: string }> = [];
			expandAll(element, originalStyles);

			// Detect theme
			const isDark = theme === 'dark';
			const bgColor = isDark ? '#2A2A2A' : '#F5F4F3';

			// Generate image, filter out .no-print elements
			const canvas = await htmlToImage.toCanvas(element, {
				cacheBust: true,
				backgroundColor: bgColor,
				filter: (node) => !(node instanceof Element && node.classList.contains('no-print'))
			});
			const canvasDataUrl = await htmlToImage.toPng(element, {
				cacheBust: true,
				backgroundColor: bgColor,
				filter: (node) => !(node instanceof Element && node.classList.contains('no-print'))
			});

			// Restore styles
			originalStyles.forEach(({ element, overflow, overflowX, overflowY, maxHeight, height, width, maxWidth }) => {
				const htmlEl = element as HTMLElement;
				htmlEl.style.overflow = overflow;
				htmlEl.style.overflowX = overflowX;
				htmlEl.style.overflowY = overflowY;
				htmlEl.style.maxHeight = maxHeight;
				htmlEl.style.maxWidth = maxWidth;
				htmlEl.style.height = height;
				htmlEl.style.width = width;
			});
			noPrintEls.forEach((el) => (el as HTMLElement).style.display = '');

			// PDF: Full-image, scaled to fit paper (no multipage logic needed)

			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			});

			const pdfWidth = pdf.internal.pageSize.getWidth();
			const pdfHeight = pdf.internal.pageSize.getHeight();
			const imgWidth = canvas.width;
			const imgHeight = canvas.height;

			const heightRatio = pdfHeight / imgHeight;
			const scaledWidth = imgWidth * heightRatio;

			pdf.addImage(
				canvasDataUrl,
				'PNG',
				scaledWidth < pdfWidth ? (pdfWidth - scaledWidth) / 2 : 0,
				0,
				scaledWidth,
				pdfHeight
			);

			// Save PDF
			const date = new Date().toISOString().split('T')[0];
			const filename = `Report_${recording?.id || 'Recording'}_${date}.pdf`;
			pdf.save(filename);

		} catch (err) {
			console.error("Failed to download PDF:", err);
		} finally {
			setIsDownloadingPDF(false);
		}
	};



	const requestDownloadPDF = async () => {
		await toast.promise(
			new Promise<void>(async (resolve, reject) => {
				try {
					setIsDownloadingPDF(true);
					await handleDownloadPDF();
					resolve();
				} catch (err) {
					reject(err);
				}
			}),
			{
				pending: 'Generating PDF...',
				success: 'PDF generated successfully!',
				error: 'Failed to generate PDF.'
			},
			{
				autoClose: 5000
			}
		);
	};

	const handleDownloadVideo = async () => {
		try {

			if (!data?.info?.secureUrl) {
				toast.error("No video file available for download");
				return;
			}

			await toast.promise(
				(async () => {
					const response = await fetch(data.info.secureUrl);
					const blob = await response.blob();
					const blobUrl = URL.createObjectURL(blob);

					const a = document.createElement('a');
					a.href = blobUrl;
					a.download = `recording-${recording?.domain}-${new Date().toISOString().split('T')[0]}.webm`;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);

					URL.revokeObjectURL(blobUrl);
				}),
				{
					pending: 'Downloading video...',
					success: 'Video downloaded successfully!',
					error: 'Failed to download video.'
				},
				{
					autoClose: 5000
				}
			);
		} catch (err) {
			console.error("Video download error:", err);
			toast.error("Failed to download video");
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-4">
				<Spinner size="lg" color="primary" />
				<p className="text-foreground/70">Loading analysis...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-4">
				<div className="text-center max-w-md">
					<div className="text-6xl mb-4">⚠️</div>
					<h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
					<p className="text-foreground/70 mb-4">{error}</p>
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
					<p className="text-foreground/70 mb-4">Analysis data is not available for this recording.</p>
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

	const data = analysisData.analysis as any;

	return (
		<div className="relative font-lato mx-auto">
			<div ref={reportRef} className="flex flex-col gap-10 p-10">
				{/* Header Card */}
				<Card className="flex flex-row items-center justify-between bg-card w-full p-5">
					<div className="flex flex-col">
						<h2 className="text-2xl font-bold mb-1 text-primary">
							<span className="font-medium">Category: </span>
							{changeCategoryCase(recording?.domain) || changeCategoryCase(data.info?.category) || 'N/A'}
						</h2>
						<p className="text-foreground/80">
							Report generated on: {recording?.createdAt
								? new Date(recording.createdAt).toDateString()
								: new Date().toDateString()
							}
						</p>
						{recording && (
							<p className="text-foreground/80 text-sm mt-1">
								Duration: {Math.floor(recording.duration / 60)}m {recording.duration % 60}s
							</p>
						)}
					</div>
					<div className="flex gap-2 no-print">
						<Button
							onClick={handleDownloadVideo}
							isIconOnly={true}
							variant="bordered"
							className="w-12 h-12 text-primary hover:bg-primary/10"
							title="Download Video"
						>
							<FcVideoCall className="size-6" />
						</Button>
						<Button
							onClick={requestDownloadPDF}
							isIconOnly={true}
							isLoading={isDownloadingPDF}
							disabled={isDownloadingPDF}
							className="active-sidebar-btn w-12 h-12 text-primary hover:bg-primary-dark"
							title="Download PDF"
						>
							{!isDownloadingPDF && <FaDownload className="size-5" />}
						</Button>
					</div>
				</Card>

				{/* Overall Score */}
				<div className="flex items-start justify-between">
					<ScoreCard percent={data.overall_score || 0} />
					<div className="flex flex-wrap justify-end gap-5">
						<Meter type="fluency" score={data.fluency_evaluator?.fluency_score || 0} />
						<Meter type="clarity" score={data.speech_evaluator?.clarity_score || 0} />
						<Meter type="grammar" score={data.language_evaluator?.grammar_score || 0} />
						<Meter type="confidence" score={data.speech_evaluator?.confidence_score || 0} />
						<Meter type="posture" score={data.posture_evaluator?.score || 0} />
						<Meter type="structure" score={data.language_evaluator?.structure_score || 0} />
					</div>
				</div>

				{/* Summary & WPM */}
				<div className="flex gap-5 flex-wrap scrollable">
					<Card className="flex-1 min-w-[300px] bg-card max-h-80 overflow-auto p-5 scrollable">
						<CardHeader className="font-medium text-lg">Transcript</CardHeader>
						<CardBody className="scrollable">
							<p className="text-base text-text whitespace-pre-wrap">
								{data.transcript || 'No transcript available'}
							</p>
						</CardBody>
					</Card>
					<WordsMeter wpm={data.speaking_rate || 0} />
				</div>

				{/* Evaluation Section */}
				<div className="flex gap-5 flex-wrap">
					<ScrollDiv heading="Fluency Evaluation" className="flex-1 min-w-[300px] scrollable">
						<p>{data.fluency_evaluator?.comment || 'No fluency evaluation available'}</p>
					</ScrollDiv>

					<ScrollDiv heading="Posture Evaluation" className="flex-1 min-w-[300px] scrollable">
						{data.posture_evaluator?.tips && data.posture_evaluator.tips.length > 0 ? (
							<ul className="space-y-2">
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
				<Card className={`flex-1 w-full min-w-[300px] bg-card p-5 scrollable ${isDownloadingPDF ? "" : "max-h-96 overflow-auto"
					}`}>
					<CardHeader className="font-medium text-lg">Language Coach</CardHeader>
					<CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5 scrollable">
						<Card className="flex flex-col p-3 bg-success shadow-sm scrollable">
							<CardHeader>
								<h4 className="font-medium text-lg text-success">What went well</h4>
							</CardHeader>
							<CardBody className="scrollable">
								{data.language_evaluator?.strengths && data.language_evaluator.strengths.length > 0 ? (
									<ul className="space-y-2">
										{data.language_evaluator.strengths.map((t: any, i: number) => (
											<li key={i} className="flex items-start gap-2">
												<span className="text-green-500">🟢</span>
												<span>{t}</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-foreground/70">No strengths recorded</p>
								)}
							</CardBody>
						</Card>
						<Card className="flex flex-col p-3 bg-error shadow-sm scrollable">
							<CardHeader>
								<h4 className="font-medium text-lg text-error">Areas of improvement</h4>
							</CardHeader>
							<CardBody className="scrollable">
								{data.language_evaluator?.improvements && data.language_evaluator.improvements.length > 0 ? (
									<ul className="space-y-2">
										{data.language_evaluator.improvements.map((t: any, i: number) => (
											<li key={i} className="flex items-start gap-2">
												<span className="text-red-500">🔴</span>
												<span>{t}</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-foreground/70">No improvements noted</p>
								)}
							</CardBody>
						</Card>
					</CardBody>
				</Card>

				{/* Speech Evaluator */}
				<Card className={`flex-1 w-full min-w-[300px] bg-card p-5 scrollable ${isDownloadingPDF ? "" : "max-h-96 overflow-auto"
					}`}>
					<CardHeader className="font-medium text-lg">Speech Evaluator</CardHeader>
					<CardBody className="grid grid-cols-1 md:grid-cols-2 gap-5 scrollable">
						<Card className="flex flex-col p-3 bg-success shadow-sm scrollable">
							<CardHeader>
								<h4 className="font-medium text-lg text-success">What went well</h4>
							</CardHeader>
							<CardBody className="scrollable">
								{data.speech_evaluator?.strengths && data.speech_evaluator.strengths.length > 0 ? (
									<ul className="space-y-2">
										{data.speech_evaluator.strengths.map((t: any, i: number) => (
											<li key={i} className="flex items-start gap-2">
												<span className="text-green-500">🟢</span>
												<span>{t}</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-foreground/70">No strengths recorded</p>
								)}
							</CardBody>
						</Card>
						<Card className="flex flex-col p-3 bg-error shadow-sm scrollable">
							<CardHeader>
								<h4 className="font-medium text-lg text-error">Areas of improvement</h4>
							</CardHeader>
							<CardBody className="scrollable">
								{data.speech_evaluator?.improvements && data.speech_evaluator.improvements.length > 0 ? (
									<ul className="space-y-2">
										{data.speech_evaluator.improvements.map((t: any, i: number) => (
											<li key={i} className="flex items-start gap-2">
												<span className="text-red-500">🔴</span>
												<span>{t}</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-foreground/70">No improvements noted</p>
								)}
							</CardBody>
						</Card>
					</CardBody>
				</Card>

				{/* Recording Metadata */}
				{recording && (
					<Card className="bg-card w-full p-5 scrollable">
						<CardHeader className="font-medium text-lg">Recording Details</CardHeader>
						<CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm scrollable">
							<div>
								<p className="text-foreground/70">Status</p>
								<p className="font-semibold capitalize">{recording.status}</p>
							</div>
							<div>
								<p className="text-foreground/70">Recorded On</p>
								<p className="font-semibold">
									{new Date(recording.createdAt).toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-foreground/70">File Size</p>
								<p className="font-semibold">
									{data.info.videoFileSize
										? `${(data.info.videoFileSize / 1024 / 1024).toFixed(2)} MB`
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