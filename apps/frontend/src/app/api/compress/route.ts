// app/api/compress-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
	let inputPath = '';
	let outputPath = '';

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json(
				{ success: false, error: 'No file provided' },
				{ status: 400 }
			);
		}

		// Check if ffmpeg is available
		try {
			await execAsync('ffmpeg -version');
		} catch {
			console.error('FFmpeg not installed on server');
			// If ffmpeg not available, return original file
			const buffer = await file.arrayBuffer();
			return NextResponse.json({
				success: true,
				data: {
					compressed: false,
					file: Buffer.from(buffer),
					originalSize: file.size,
					compressedSize: file.size,
				}
			});
		}

		const tempDir = path.join(process.cwd(), 'tmp');
		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true });
		}

		inputPath = path.join(tempDir, `input_${Date.now()}.webm`);
		outputPath = path.join(tempDir, `output_${Date.now()}.webm`);

		// Write uploaded file to disk
		const buffer = await file.arrayBuffer();
		fs.writeFileSync(inputPath, Buffer.from(buffer));

		const originalSize = file.size;
		console.log(`📹 Input size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

		// Compress with FFmpeg
		const ffmpegCmd = `ffmpeg -i "${inputPath}" -c:v vp9 -crf 32 -b:v 500k -c:a libopus -b:a 64k -threads 4 -deadline good -y "${outputPath}"`;

		console.log('🔧 Compressing video...');
		await execAsync(ffmpegCmd);

		// Read compressed file
		const compressedBuffer = fs.readFileSync(outputPath);
		const compressedSize = compressedBuffer.length;
		const reduction = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);

		console.log(`✅ Compression complete:`);
		console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
		console.log(`   Compressed: ${(compressedSize / 1024 / 1024).toFixed(2)} MB`);
		console.log(`   Reduction: ${reduction}%`);

		return NextResponse.json({
			success: true,
			data: {
				compressed: true,
				file: compressedBuffer,
				originalSize,
				compressedSize,
				reduction: `${reduction}%`,
			}
		}, {
			headers: {
				'Content-Type': 'application/json',
			}
		});

	} catch (error: any) {
		console.error('❌ Compression error:', error);
		return NextResponse.json(
			{ success: false, error: error.message || 'Compression failed' },
			{ status: 500 }
		);

	} finally {
		// Cleanup temp files
		try {
			if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
			if (outputPath && fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
		} catch (err) {
			console.error('Cleanup error:', err);
		}
	}
}