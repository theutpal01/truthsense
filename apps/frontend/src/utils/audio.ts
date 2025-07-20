export function encodeWAV(audioBuffer: AudioBuffer): Blob {
	const numChannels = audioBuffer.numberOfChannels;
	const sampleRate = audioBuffer.sampleRate;
	const samples = audioBuffer.length;

	const buffer = new ArrayBuffer(44 + samples * 2 * numChannels);
	const view = new DataView(buffer);

	let offset = 0;

	const writeString = (str: string) => {
		for (let i = 0; i < str.length; i++) {
			view.setUint8(offset + i, str.charCodeAt(i));
		}
		offset += str.length;
	};

	const write16 = (val: number) => {
		view.setInt16(offset, val, true);
		offset += 2;
	};

	const write32 = (val: number) => {
		view.setInt32(offset, val, true);
		offset += 4;
	};

	// RIFF chunk descriptor
	writeString('RIFF');
	write32(36 + samples * 2 * numChannels); // file length
	writeString('WAVE');

	// fmt subchunk
	writeString('fmt ');
	write32(16); // SubChunk1Size
	write16(1); // Audio format (1 = PCM)
	write16(numChannels);
	write32(sampleRate);
	write32(sampleRate * numChannels * 2); // Byte rate
	write16(numChannels * 2); // Block align
	write16(16); // Bits per sample

	// data subchunk
	writeString('data');
	write32(samples * 2 * numChannels);

	// Write PCM samples
	for (let i = 0; i < samples; i++) {
		for (let ch = 0; ch < numChannels; ch++) {
			const sample = audioBuffer.getChannelData(ch)[i] ?? 0;
			const s = Math.max(-1, Math.min(1, sample));
			view.setInt16(offset, s * 0x7FFF, true);
			offset += 2;
		}
	}

	return new Blob([buffer], { type: 'audio/wav' });
}


export const exportWavFromRecording = async (recordedChunks: Blob[]) => {
	console.log("Exporting WAV from recording...");
	if (!recordedChunks || recordedChunks.length === 0) {
		console.error("No recorded chunks available for export.");
		return;
	}

	const webmBlob = new Blob(recordedChunks, { type: 'video/webm' });
	const arrayBuffer = await webmBlob.arrayBuffer();

	const audioCtx = new AudioContext();
	const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
	const wavBlob = encodeWAV(audioBuffer);

	// Optional: Download the WAV
	const url = URL.createObjectURL(wavBlob);
	console.log("WAV Blob URL:", url);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'recording.wav';
	a.click();
	URL.revokeObjectURL(url);
};