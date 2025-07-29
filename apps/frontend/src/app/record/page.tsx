"use client";
import RecordingPage from '@/components/recoding-page'
import { AuthGuard } from '@/services/auth-guard';
import React from 'react';

const RecordPage = () => {
	return (
		<AuthGuard>
			<RecordingPage />
		</AuthGuard>
	)
}

export default RecordPage