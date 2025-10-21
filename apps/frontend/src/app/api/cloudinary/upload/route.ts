import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (server-side only)
cloudinary.config({
	cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
	api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!,
	api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET!
});

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

		// Upload to Cloudinary using upload_stream
		const uploadResult = await new Promise<any>((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{
					resource_type: 'video',
					folder: folder,
					public_id: `recording_${recordingId}_${Date.now()}`,
					format: 'webm',
					tags: [userId, 'recording', recordingId, 'video'],
					context: {
						userId: userId,
						userEmail: userEmail,
						recordingId: recordingId,
						uploadDate: new Date().toISOString()
					}
				},
				(error: any, result: any) => {
					if (error) {
						console.error('❌ Cloudinary upload error:', error);
						reject(error);
					} else {
						console.log('✅ Cloudinary upload success:', result?.secure_url);
						resolve(result);
					}
				}
			);

			uploadStream.end(buffer);
		});

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
		console.error('❌ Upload error:', error);
		return NextResponse.json(
			{ success: false, error: error.message || 'Upload failed' },
			{ status: 500 }
		);
	}
}
