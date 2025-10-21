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
 * This is more secure as API secrets stay on the server
 */
export async function uploadVideoToCloudinary(
	videoFile: File,
	user: User,
	recordingId: string,
	onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse> {
	console.log('📤 Uploading video via backend proxy...');
	console.log('📹 Video size:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');

	// Create user-specific folder
	const userFolder = sanitizeFolderName(user.name || user.email || user.id);
	const folderPath = `recordings/${userFolder}`;

	// Create FormData for upload
	const formData = new FormData();
	formData.append('file', videoFile);
	formData.append('folder', folderPath);
	formData.append('recordingId', recordingId);
	formData.append('userId', user.id);
	formData.append('userEmail', user.email);

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
				const response = JSON.parse(xhr.responseText);

				if (!response.success) {
					console.error('❌ Upload failed:', response.error);
					reject(new Error(response.error || 'Upload failed'));
					return;
				}

				console.log('✅ Video uploaded successfully:', response.data.secure_url);
				resolve(response.data as CloudinaryUploadResponse);
			} else {
				console.error('❌ Upload failed:', xhr.responseText);
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

		// Upload via backend proxy
		xhr.open('POST', '/api/cloudinary/upload');
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

		console.log('✅ Video deleted successfully:', result);
	} catch (error) {
		console.error('❌ Delete error:', error);
		throw error;
	}
}