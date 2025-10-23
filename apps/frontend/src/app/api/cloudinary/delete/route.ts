import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
	cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
	api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!,
	api_secret: process.env.CLOUDINARY_API_SECRET!
});

export async function POST(request: NextRequest) {
	try {
		const { publicId } = await request.json();

		if (!publicId) {
			return NextResponse.json(
				{ success: false, error: 'Public ID is required' },
				{ status: 400 }
			);
		}

		console.log('🗑️ Backend: Deleting from Cloudinary:', publicId);

		const result = await cloudinary.uploader.destroy(publicId, {
			resource_type: 'video'
		});

		console.log('✅ Cloudinary delete result:', result);

		if (result.result === 'ok') {
			return NextResponse.json({
				success: true,
				message: 'Video deleted successfully',
				result: result
			});
		} else {
			return NextResponse.json(
				{ success: false, error: 'Failed to delete video', result: result },
				{ status: 400 }
			);
		}

	} catch (error: any) {
		console.error('❌ Cloudinary delete error:', error);
		return NextResponse.json(
			{ success: false, error: error.message || 'Failed to delete video' },
			{ status: 500 }
		);
	}
}