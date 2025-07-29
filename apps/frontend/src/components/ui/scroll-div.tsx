import { Card, CardBody, CardHeader } from '@heroui/react'
import React from 'react'

const ScrollDiv = ({ className, color = "default", size = 'h-72', heading, children }: {
	className: string, color?: "default" | "success" | "warning" | "error", size?: string, heading: string, children: React.ReactNode
}) => {

	const colors = {
		"success": ["bg-gradient-to-r from-green-100 to-green-100/30", "text-green-800"],
		"warning": ["bg-gradient-to-r from-yellow-100 to-yellow-100/30", "text-yellow-800"],
		"error": ["bg-gradient-to-r from-red-100 to-red-100/30", "text-red-800"],
	}


	return (
		<Card className={`bg-card h-80 w-5/12 flex p-5 grow ${className} ${color !== "default" ? colors[color][0] : ""}`}>
			<CardHeader>
				<h3 className={`${color !== "default" ? colors[color][1] : ""} font-medium`}>{heading}</h3>
			</CardHeader>
			<CardBody className={`flex text-text ${size} overflow-auto`}>
				{children}
			</CardBody>
		</Card>

	)
}

export default ScrollDiv