#!/usr/bin/env python3
import wave
import struct
import math
import os

# Create test directory if it doesn't exist
os.makedirs('media/test', exist_ok=True)

# Parameters
sample_rate = 44100
duration = 5  # seconds
frequency = 440  # A4 note
amplitude = 0.3

# Generate sine wave data
num_samples = sample_rate * duration
samples = []
for i in range(num_samples):
    t = i / sample_rate
    value = amplitude * math.sin(2 * math.pi * frequency * t)
    # Convert to 16-bit integer
    sample = int(value * 32767)
    samples.append(sample)

# Write WAV file
with wave.open('media/test/test.wav', 'wb') as wav_file:
    # Set parameters: 1 channel, 2 bytes per sample, 44100 Hz
    wav_file.setnchannels(1)
    wav_file.setsampwidth(2)
    wav_file.setframerate(sample_rate)
    
    # Write the samples
    for sample in samples:
        wav_file.writeframes(struct.pack('<h', sample))

print(f"Created test.wav: {duration} seconds, {sample_rate} Hz, {os.path.getsize('media/test/test.wav')} bytes")