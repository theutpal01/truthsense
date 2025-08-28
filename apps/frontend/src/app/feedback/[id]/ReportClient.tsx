/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState, useRef } from "react";
import { Button, Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import Meter from "@/components/feedback/Meter";
import ScoreCard from "@/components/feedback/ScoreCard";
import ScrollDiv from "@/components/ui/scroll-div";
import WordsMeter from "@/components/feedback/WordsMeter";
import { useRecording } from "@/hooks/useAPI";
import { FaDownload } from "react-icons/fa";
import { AuthGuard } from "@/services/auth-guard";


const Report = ({ id }: { id: string }) => {
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<Record<string, any> | undefined>();
	const { fetchRecordingAnalysis } = useRecording();
	const reportRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		(async () => {
			try {
				const result = await fetchRecordingAnalysis(id);
				setData(result);
				console.log("📊 Analysis data:", result);
			} catch (err) {
				console.error("❌ Fetch error:", err);
			} finally {
				setLoading(false);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const handleDownloadPDF = () => {
		if (!reportRef.current) return;
		// html2pdf()
		// 	.from(reportRef.current)
		// 	.set({
		// 		margin: 0.5,
		// 		filename: `Report-${id}.pdf`,
		// 		image: { type: "jpeg", quality: 0.98 },
		// 		html2canvas: { scale: 2 },
		// 		jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
		// 	})
		// 	.save();
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!data) {
		return (
			<div className="text-center text-red-600 mt-20">Failed to load analysis.</div>
		);
	}

	return (
		<AuthGuard>
			<div className="relative font-lato mx-auto px-8 py-10">
				<div ref={reportRef} className="flex flex-col gap-10">

					<Card className="flex flex-row items-center justify-between bg-card w-full p-5">
						<div className="flex flex-col">
							<h2 className="text-2xl font-bold mb-1 text-primary"><span className="font-medium">Category: </span>{data.info.category}</h2>
							<p>Report generated on: {new Date(data.info.reportCreated).toDateString()}</p>
						</div>
						<Button
							onClick={handleDownloadPDF}
							isIconOnly={true}
							className="active-sidebar-btn w-12 h-12 text-primary hover:bg-primary-dark"
						>
							<FaDownload className="size-5" />
						</Button>
					</Card>

					{/* Overall Score */}
					<div className="flex items-start justify-between">
						<ScoreCard percent={data.overall_score} />
						<div className="flex flex-wrap justify-end gap-5">
							<Meter type="fluency" score={data.fluency_evaluator.fluency_score} />
							<Meter type="clarity" score={data.speech_evaluator.clarity_score} />
							<Meter type="grammar" score={data.language_evaluator.grammar_score} />
							<Meter type="confidence" score={data.speech_evaluator.confidence_score} />
							<Meter type="posture" score={data.posture_evaluator.score} />
							<Meter type="structure" score={data.language_evaluator.structure_score} />
						</div>
					</div>

					{/* Summary & WPM */}
					<div className="flex gap-5">
						<Card className="w-full bg-card h-80 overflow-auto p-5">
							<CardHeader className="font-medium text-lg">Transcript</CardHeader>
							<CardBody><p className="text-base text-text">{data.transcript}</p></CardBody>
						</Card>
						<WordsMeter wpm={data.speaking_rate} />
					</div>

					{/* Evaluation Section */}
					<div className="flex gap-5">
						<ScrollDiv heading="Fluency Evaluation" className="w-1/2">
							<p>{data.fluency_evaluator.comment}</p>
						</ScrollDiv>

						<ScrollDiv heading="Posture Evaluation" className="w-1/2">
							<ul>
								{data.posture_evaluator.tips.map((point: string, index: number) => (
									<li key={index} className="list-disc list-inside">{point}</li>
								))}
							</ul>
						</ScrollDiv>
					</div>

					<Card className="bg-card w-full h-96 overflow-auto p-5">
						<CardHeader className="font-medium text-lg">Language Coach</CardHeader>
						<CardBody className="grid grid-cols-2 gap-5">
							<Card className="flex flex-col p-3 bg-success shadow-sm">
								<CardHeader><h4 className="font-medium text-lg text-success">What went well</h4></CardHeader>
								<CardBody>
									<ul className="list-disc list-inside">
										{data.language_evaluator.strengths.map((t: any, i: number) => (
											<li key={i} className="list-none">
												🟢 {t}
											</li>
										))}
									</ul>
								</CardBody>
							</Card>
							<Card className="flex flex-col p-3 bg-error shadow-sm">
								<CardHeader><h4 className="font-medium text-lg text-error">Areas of improvement</h4></CardHeader>
								<CardBody>
									<ul className="list-disc list-inside">
										{data.language_evaluator.improvements.map((t: any, i: number) => (
											<li key={i} className="list-none">
												🔴 {t}
											</li>
										))}
									</ul>
								</CardBody>
							</Card>
						</CardBody>
					</Card>


					<Card className="bg-card w-full h-96 overflow-auto p-5">
						<CardHeader className="font-medium text-lg">Speech Evaluator</CardHeader>
						<CardBody className="grid grid-cols-2 gap-5">
							<Card className="flex flex-col p-3 bg-success shadow-sm">
								<CardHeader><h4 className="font-medium text-lg text-success">What went well</h4></CardHeader>
								<CardBody>
									<ul className="list-disc list-inside">
										{data.speech_evaluator.strengths.map((t: any, i: number) => (
											<li key={i} className="list-none">
												🟢 {t}
											</li>
										))}
									</ul>
								</CardBody>
							</Card>
							<Card className="flex flex-col p-3 bg-error shadow-sm">
								<CardHeader><h4 className="font-medium text-lg text-error">Areas of improvement</h4></CardHeader>
								<CardBody>
									<ul className="list-disc list-inside">
										{data.speech_evaluator.improvements.map((t: any, i: number) => (
											<li key={i} className="list-none">
												🔴 {t}
											</li>
										))}
									</ul>
								</CardBody>
							</Card>
						</CardBody>
					</Card>
				</div >
			</div >
		</AuthGuard>
	);
};

export default Report;