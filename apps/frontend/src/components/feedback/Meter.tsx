"use client";
import { Card } from '@heroui/react';
import React from 'react'
import WaveBars from './WaveBars';

const Meter = ({ type, score }: { type: 'fluency' | 'clarity' | 'grammar' | 'confidence' | 'posture' | 'structure', score: number }) => {

	const colors = {
		fluency: ['from-[#EF90AB]/40 to-[#EF90AB]', 'text-[#EF90AB]'],
		clarity: ['from-[#229FB0]/40 to-[#229FB0]', 'text-[#229FB0]'],
		grammar: ['from-[#22C891]/40 to-[#22C891]', 'text-[#22C891]'],
		confidence: ['from-[#FBB540]/40 to-[#FBB540]', 'text-[#FBB540]'],
		posture: ['from-[#8E92CF]/40 to-[#8E92CF]', 'text-[#8E92CF]'],
		structure: ['from-[#A2B45C]/40 to-[#A2B45C]', 'text-[#A2B45C]']
	}

	return (
		<Card className='flex flex-col items-center justify-center bg-card p-5 px-16'>
			<WaveBars score={score} color={colors[type][0]} />
			<p className={`mt-3 text-center font-medium ${colors[type][1]}`}>{type.charAt(0).toUpperCase() + type.slice(1)}: <span>{score}</span></p>
		</Card>
	)
}

export default Meter;