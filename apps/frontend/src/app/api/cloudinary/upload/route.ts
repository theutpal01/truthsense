import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

export const maxDuration = 60; // 10 minutes for Vercel Pro (or use 60 for free tier)

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const folder = formData.get('folder') as string;
		const recordingId = formData.get('recordingId') as string;
		const userId = formData.get('userId') as string;
		const userEmail = formData.get('userEmail') as string;

		if (!file) {
			return NextResponse.json(
				{ success: false, error: 'No file provided' },
				{ status: 400 }
			);
		}

		console.log('📤 Backend: Uploading to Cloudinary...');
		console.log('📹 File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
		console.log('📁 Folder:', folder);

		// Convert File to Buffer
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Create FormData for Cloudinary API
		const cloudinaryForm = new FormData();
		cloudinaryForm.append('file', new Blob([buffer], { type: 'video/webm' }), 'recording.webm');
		cloudinaryForm.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
		cloudinaryForm.append('folder', folder);
		cloudinaryForm.append('public_id', `recording_${recordingId}_${Date.now()}`);
		cloudinaryForm.append('resource_type', 'video');
		cloudinaryForm.append('tags', `${userId},recording,${recordingId},video`);
		cloudinaryForm.append('context', `userId=${userId}|userEmail=${userEmail}|recordingId=${recordingId}`);

		const uploadUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`;

		console.log('⏱️ Sending to Cloudinary...');

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 300000);

		const uploadResponse = await fetch(uploadUrl, {
			method: 'POST',
			body: cloudinaryForm as any,
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!uploadResponse.ok) {
			const errorText = await uploadResponse.text();
			console.error('❌ Cloudinary HTTP error:', uploadResponse.status, errorText);
			throw new Error(`Cloudinary failed with status ${uploadResponse.status}`);
		}

		const uploadResult = (await uploadResponse.json()) as any;

		if (uploadResult.error) {
			console.error('❌ Cloudinary API error:', uploadResult.error);
			throw new Error(uploadResult.error.message || 'Upload failed');
		}

		console.log('✅ Upload success:', uploadResult.secure_url);

		return NextResponse.json({
			success: true,
			data: {
				secure_url: uploadResult.secure_url,
				public_id: uploadResult.public_id,
				resource_type: uploadResult.resource_type,
				format: uploadResult.format,
				bytes: uploadResult.bytes,
				duration: uploadResult.duration,
				url: uploadResult.url,
				created_at: uploadResult.created_at
			}
		});

	} catch (error: any) {
		console.error('❌ Upload error:', error.message);
		return NextResponse.json(
			{ success: false, error: error.message || 'Upload failed' },
			{ status: 500 }
		);
	}
}