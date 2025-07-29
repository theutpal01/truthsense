"use client";
import { Card, CardBody, Image } from '@heroui/react';
import React from 'react'

const ScoreCard = ({ percent }: { percent: number }) => {
	const radius = 94;
	const circumference = 2 * Math.PI * radius;
	const progress = (percent / 100) * circumference;
	const strokeDashoffset = circumference - progress;

	return (
		<Card className='min-w-96 bg-card min-h-[29rem] flex h-full flex-col justify-center items-center p-5'>
			<CardBody className='flex flex-col items-center justify-center gap-8'>

				<div className="relative w-50 h-50">
					<svg width="200" height="200" className="absolute z-10 top-0 left-0 rotate-[-90deg] pointer-events-none" >
						<circle
							cx="100"
							cy="100"
							r={radius}
							stroke="#70b0ba" // progress ring
							strokeWidth="12"
							fill="none"
							strokeDasharray={circumference}
							strokeDashoffset={strokeDashoffset}
							strokeLinecap="round"
						/>
					</svg>
					<div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
						<div className='bg-record-btn w-50 h-50 rounded-full flex items-center justify-center p-8 shadow-lg'>
							<Image src={`/images/utils/performance.svg`} alt="Score" className='w-full h-full' />
						</div>
					</div>

				</div>
				<p className='font-medium text-text'>
					Overall Score: <span className='text-[#70b0ba] font-semibold'>{percent}</span>
				</p>
			</CardBody>
		</Card>
	)
}

export default ScoreCard