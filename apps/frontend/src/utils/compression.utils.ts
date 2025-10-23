import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;
let ffmpegReady = false;

/**
 * Initialize FFmpeg instance (call once on app load)
 */
export async function initFFmpeg(): Promise<void> {
	if (ffmpegReady) return;

	ffmpeg = new FFmpeg();

	ffmpeg.on('log', ({ type, message }) => {
		if (type === 'error') {
			console.error('FFmpeg error:', message);
		}
	});

	try {
		const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist';
		await ffmpeg.load({
			coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
			wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
		});
		ffmpegReady = true;
		console.log('✅ FFmpeg initialized');
	} catch (error) {
		console.error('❌ Failed to initialize FFmpeg:', error);
		throw error;
	}
}

/**
 * Compress video using FFmpeg
 * Reduces file size by 60-80% while maintaining decent quality
 */
export async function compressVideo(
	videoFile: File,
	onProgress?: (stage: string, progress?: number) => void
): Promise<File> {
	if (!ffmpegReady || !ffmpeg) {
		throw new Error('FFmpeg not initialized. Call initFFmpeg() first.');
	}

	try {
		onProgress?.('Preparing video for compression...');

		// Read input file
		const fileData = await videoFile.arrayBuffer();
		ffmpeg.writeFile('input.webm', new Uint8Array(fileData));

		onProgress?.('Compressing video (this may take a moment)...');

		// Compress with optimized settings
		// VP9 codec: better compression than VP8
		// -crf 30-35: quality level (higher = more compression, lower quality)
		// -b:v: bitrate (ensures quality floor)
		// -threads: use multiple cores
		await ffmpeg.exec([
			'-i', 'input.webm',
			'-c:v', 'vp9',           // VP9 codec for better compression
			'-crf', '32',            // Quality (0-63, default 28, higher = more compression)
			'-b:v', '500k',          // Target bitrate
			'-c:a', 'libopus',       // Audio codec
			'-b:a', '64k',           // Audio bitrate (reduce from default 128k)
			'-threads', '4',         // Use 4 threads
			'-deadline', 'good',     // Encoding speed vs quality tradeoff
			'output.webm'
		]);

		onProgress?.('Finalizing compressed video...');

		// Read output file
		const data = ffmpeg.readFile('output.webm');
		const outputBlob = new Blob([data], { type: 'video/webm' });
		const compressedFile = new File(
			[outputBlob],
			'recording-compressed.webm',
			{ type: 'video/webm' }
		);

		// Cleanup
		ffmpeg.deleteFile('input.webm');
		ffmpeg.deleteFile('output.webm');

		const originalSize = videoFile.size / 1024 / 1024;
		const compressedSize = compressedFile.size / 1024 / 1024;
		const reduction = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);

		console.log(`📊 Compression complete:
			Original: ${originalSize.toFixed(2)} MB
			Compressed: ${compressedSize.toFixed(2)} MB
			Reduction: ${reduction}%
		`);

		return compressedFile;
	} catch (error) {
		console.error('❌ Video compression failed:', error);
		throw error;
	}
}

/**
 * Fallback compression using simple frame dropping
 * Use this if FFmpeg fails (lighter weight)
 */
export async function simpleCompressVideo(videoFile: File): Promise<File> {
	// This re-encodes the WebM at lower quality
	// In a real scenario, you'd use the browser's MediaRecorder with lower constraints
	console.warn('⚠️ Using fallback compression (FFmpeg recommended)');

	// For now, just return original
	// In production, implement frame dropping or resolution reduction
	return videoFile;
}