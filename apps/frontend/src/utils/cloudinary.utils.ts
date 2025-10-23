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
 * Compresses video on server before upload for faster transfers
 */
export async function uploadVideoToCloudinary(
	videoFile: File,
	user: User,
	recordingId: string,
	onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResponse> {
	console.log('📤 Starting video upload process...');
	console.log('📹 Original size:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');

	let fileToUpload = videoFile;

	try {
		// Step 1: Compress video on server
		console.log('🔧 Compressing video...');
		const compressFormData = new FormData();
		compressFormData.append('file', videoFile);

		const compressRes = await fetch('/api/compress', {
			method: 'POST',
			body: compressFormData,
		});

		const compressData = await compressRes.json();

		if (compressData.success && compressData.data.compressed) {
			const compressedBlob = new Blob([Buffer.from(compressData.data.file.data)], { type: 'video/webm' });
			fileToUpload = new File([compressedBlob], 'recording-compressed.webm', { type: 'video/webm' });
			console.log(`✅ Compression complete: ${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB (${compressData.data.reduction})`);
		} else {
			console.warn('⚠️ Compression skipped, uploading original file');
		}
	} catch (compressionError) {
		console.warn('⚠️ Compression failed, uploading original file:', compressionError);
		// Continue with original file
	}

	// Step 2: Upload compressed file to Cloudinary
	const userFolder = sanitizeFolderName(user.name || user.email || user.id);
	const folderPath = `recordings/${userFolder}`;

	const formData = new FormData();
	formData.append('file', fileToUpload);
	formData.append('folder', folderPath);
	formData.append('recordingId', recordingId);
	formData.append('userId', user.id);
	formData.append('userEmail', user.email);

	console.log('📁 Folder:', folderPath);

	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();

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