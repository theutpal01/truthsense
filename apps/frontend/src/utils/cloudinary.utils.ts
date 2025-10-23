import { User } from '@/types/auth.types';
import { CloudinaryUploadResponse } from '@/types/recording.types';

/**
 * Sanitize folder name for Cloudinary
 */
export function sanitizeFolderName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, '_')
		.replace(/_+/g, '_')
		.substring(0, 50);
}

/**
 * Upload video to Cloudinary via backend proxy
 * Skips compression since video is already optimized at source (480p, 1.5Mbps)
 */
export async function uploadVideoToCloudinary(
	videoFile: File,
	user: User,
	recordingId: string,
	onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse> {
	console.log('📤 Starting video upload to Cloudinary...');
	console.log('📹 File size:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');

	const userFolder = sanitizeFolderName(user.name || user.email || user.id);
	const folderPath = `recordings/${userFolder}`;

	console.log('📁 Folder:', folderPath);

	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();

		// Track upload progress
		if (onProgress) {
			xhr.upload.addEventListener('progress', (e) => {
				if (e.lengthComputable) {
					const progress = Math.round((e.loaded / e.total) * 100);
					onProgress(progress);
					console.log(`📊 Upload progress: ${progress}%`);
				}
			});
		}

		xhr.addEventListener('load', () => {
			if (xhr.status === 200) {
				try {
					const response = JSON.parse(xhr.responseText);

					if (!response.success) {
						console.error('❌ Upload failed:', response.error);
						reject(new Error(response.error || 'Upload failed'));
						return;
					}

					console.log('✅ Video uploaded successfully:', response.data.secure_url);
					resolve(response.data as CloudinaryUploadResponse);
				} catch (parseError) {
					console.error('❌ Failed to parse response:', parseError);
					reject(new Error('Invalid response from server'));
				}
			} else {
				console.error('❌ Upload failed with status:', xhr.status);
				reject(new Error(`Upload failed with status ${xhr.status}`));
			}
		});

		xhr.addEventListener('error', () => {
			console.error('❌ Network error during upload');
			reject(new Error('Network error during upload'));
		});

		xhr.addEventListener('abort', () => {
			console.error('❌ Upload aborted');
			reject(new Error('Upload aborted'));
		});

		xhr.addEventListener('timeout', () => {
			console.warn('⚠️ XHR timeout reached, but server may still be processing...');
			// Don't reject immediately - wait a bit for server response
		});

		// Send to backend
		const formData = new FormData();
		formData.append('file', videoFile);
		formData.append('folder', folderPath);
		formData.append('recordingId', recordingId);
		formData.append('userId', user.id);
		formData.append('userEmail', user.email);

		xhr.open('POST', '/api/cloudinary/upload');
		xhr.timeout = 600000; // 10 minute timeout (match server)
		xhr.send(formData);
	});
}

/**
 * Delete video from Cloudinary via backend proxy
 */
export async function deleteVideoFromCloudinary(publicId: string): Promise<void> {
	console.log('🗑️ Deleting video from Cloudinary:', publicId);

	try {
		const response = await fetch('/api/cloudinary/delete', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ publicId }),
		});

		const result = await response.json();

		if (!response.ok || !result.success) {
			throw new Error(result.error || 'Delete failed');
		}

		console.log('✅ Video deleted successfully');
	} catch (error) {
		console.error('❌ Delete error:', error);
		throw error;
	}
}