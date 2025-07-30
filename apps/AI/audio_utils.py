import io
import re
import nltk
import asyncio
import librosa
import numpy as np
import parselmouth
import soundfile as sf
from groq import AsyncClient
from pydub import AudioSegment
from nltk.corpus import cmudict
from parselmouth.praat import call
from groq.types.audio import Transcription
import logging
import time
from typing import List, Tuple, Optional

# First download the CMU dictionary if not already installed
try:
    cmu_dict = cmudict.dict()
except:
    import nltk
    nltk.download('cmudict')
    cmu_dict = cmudict.dict()    


# Async Transcription by splitting large files into chunks without saving the chunks to memory
def split_audio_in_memory(audio_path, max_mb=24):
    if isinstance(audio_path, io.BytesIO):
        audio_path.seek(0)
        audio = AudioSegment.from_file(audio_path, format='wav')
    else:
        audio = AudioSegment.from_wav(audio_path)
    
    bytes_per_ms = (audio.frame_rate * audio.frame_width * audio.channels) / 1000
    max_bytes = max_mb * 1024 * 1024
    chunk_duration_ms = int(max_bytes / bytes_per_ms)

    chunks = []
    for i in range(0, len(audio), chunk_duration_ms):
        chunk = audio[i:i+chunk_duration_ms]
        buffer = io.BytesIO()
        chunk.export(buffer, format="wav")
        buffer.seek(0)
        chunks.append((f"chunk_{i//chunk_duration_ms}.wav", buffer))

    return chunks


async def transcribe_chunk(filename, audio_buffer, client: AsyncClient, max_retries: int = 3, timeout: float = 120.0):
    """Transcribe a chunk of an audio file with timeout and retry logic

    Args:
        filename (str): Name of the audio chunk
        audio_buffer (io.BytesIO): Audio data buffer
        client (AsyncClient): Groq client for transcription
        max_retries (int): Maximum number of retry attempts
        timeout (float): Timeout in seconds for each attempt

    Returns:
        Transcription: Transcription result from Groq API
    """
    for attempt in range(max_retries):
        try:
            # Reset buffer position for each attempt
            audio_buffer.seek(0)
            
            # Apply timeout to the transcription request
            return await asyncio.wait_for(
                client.audio.transcriptions.create(
                    file=(filename, audio_buffer.read()),
                    model="whisper-large-v3",
                    response_format="verbose_json",
                    timestamp_granularities=["word"]
                ),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            logging.warning(f"Timeout transcribing {filename} (attempt {attempt + 1}/{max_retries})")
            if attempt == max_retries - 1:
                raise asyncio.TimeoutError(f"Failed to transcribe {filename} after {max_retries} attempts due to timeout")
            
            # Exponential backoff: wait 2^attempt seconds
            await asyncio.sleep(2 ** attempt)
            
        except Exception as e:
            logging.error(f"Error transcribing {filename} (attempt {attempt + 1}/{max_retries}): {str(e)}")
            if attempt == max_retries - 1:
                raise e
            
            # Wait before retry
            await asyncio.sleep(1 + attempt)


async def transcribe_audio(audio_path, client: AsyncClient, progress_callback=None):
    """Transcribe an audio file without saving the chunks to disk with improved error handling

    Args:
        audio_path (str): The path of the audio
        client (AsyncClient): The Groq client that supports async transcription of multiple files
        progress_callback (callable, optional): Callback function to report progress

    Returns:
        Transcription: A groq.types.audio.Transcription that contains the transcript, duration and the words along with their timestamps
    """
    chunks = split_audio_in_memory(audio_path)
    total_chunks = len(chunks)
    logging.info(f"Transcribing audio with {total_chunks} chunks")
    
    if progress_callback:
        progress_callback(0, total_chunks, "Starting transcription...")
    
    # Process chunks with controlled concurrency to avoid overwhelming the API
    max_concurrent = min(3, total_chunks)  # Limit concurrent requests
    completed_transcripts = []
    failed_chunks = []
    
    # Create semaphore to limit concurrent requests
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def transcribe_with_semaphore(name, buffer, chunk_index):
        async with semaphore:
            try:
                result = await transcribe_chunk(name, buffer, client)
                if progress_callback:
                    progress_callback(chunk_index + 1, total_chunks, f"Completed chunk {chunk_index + 1}/{total_chunks}")
                return result
            except Exception as e:
                logging.error(f"Failed to transcribe chunk {name}: {str(e)}")
                failed_chunks.append((chunk_index, name, str(e)))
                return None
    
    # Create tasks for all chunks
    tasks = [
        transcribe_with_semaphore(name, buffer, i)
        for i, (name, buffer) in enumerate(chunks)
    ]
    
    # Execute all tasks
    all_results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Filter out failed transcriptions
    successful_transcripts = [
        result for result in all_results 
        if result is not None and not isinstance(result, Exception)
    ]
    
    if not successful_transcripts:
        raise RuntimeError(f"All transcription chunks failed. Failed chunks: {failed_chunks}")
    
    if failed_chunks:
        logging.warning(f"Some chunks failed to transcribe: {failed_chunks}")
    
    # Combine successful results
    full_transcript = ""
    all_words = []
    total_duration = 0.0

    for chunk in successful_transcripts:
        full_transcript += chunk.text + " " if chunk.text else ""
        all_words.extend(getattr(chunk, "words", []))
        total_duration += chunk.duration or 0.0
    
    # Clean up transcript
    full_transcript = full_transcript.strip()
    
    if progress_callback:
        progress_callback(total_chunks, total_chunks, "Transcription completed")
    
    logging.info(f"Transcription completed: {len(successful_transcripts)}/{total_chunks} chunks successful")
    
    return Transcription(text=full_transcript, words=all_words, duration=total_duration)   # type: ignore


# Extract features using Parselmouth
def extract_parselmouth_features(data, sr):
    """Helper function to extract Pitch, Jitter, Shimmer and Harmonic-Noise ratio using Praat-Parselmouth

    Args:
        data (numpy.ndarray): Array containing raw information of the audio file
        sr (int): Sample rate of the audio

    Returns:
        dict: A dictionary containing all the extracted features
    """
    snd = parselmouth.Sound(values=data, sampling_frequency=sr)

    pitch_obj = snd.to_pitch()
    pitch_mean = call(pitch_obj, "Get mean", 0, 0, "Hertz")
    pitch_std = call(pitch_obj, "Get standard deviation", 0, 0, "Hertz")

    point_process = call(snd, "To PointProcess (periodic, cc)", 75, 500)
    jitter = call(point_process, "Get jitter (local)", 0, 0, 0.0001, 0.02, 1.3)
    shimmer = call([snd, point_process], "Get shimmer (local)", 0, 0, 0.0001, 0.02, 1.3, 1.6)

    harmonicity = call(snd, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
    hnr = call(harmonicity, "Get mean", 0, 0)

    return {
        "pitch_mean": pitch_mean,
        "pitch_std": pitch_std,
        "pitch_var": pitch_std**2,
        "jitter_local": jitter,
        "shimmer_local": shimmer,
        "hnr": hnr
    }


async def async_extract_parselmouth_features(data, sr, executor):
    """
    A function to asynchronously extract features using Parselmouth
    """
    return await asyncio.get_event_loop().run_in_executor(
        executor, extract_parselmouth_features, data, sr
    )


# Extract features using Librosa
def extract_librosa_features(data, sr):
    """Helper function to extract ZCR, RMS Energy, and MFCC and Delta-MFCC means using Librosa

    Args:
        data (numpy.ndarray): Array containing raw information of the audio file
        sr (int): Sample rate of the audio

    Returns:
        dict: A dictionary containing all the extracted features
    """
    zcr = np.mean(librosa.feature.zero_crossing_rate(data))
    
    rms = librosa.feature.rms(y=data)[0]
    rms_mean = np.mean(rms)
    rms_std = np.std(rms)
    rms_var = np.var(rms)

    mfcc = librosa.feature.mfcc(y=data, sr=sr, n_mfcc=13)
    delta = librosa.feature.delta(mfcc)
    mfcc_mean = np.mean(mfcc)
    delta_mean = np.mean(delta)

    return {
        "zcr": zcr,
        "rms_mean": rms_mean,
        "rms_std": rms_std,
        "rms_var": rms_var,
        "mfcc_mean": mfcc_mean,
        "delta_mean": delta_mean
    }


async def async_extract_librosa_features(data, sr, executor):
    """
    A function to asynchronously extract features using Parselmouth
    """
    return await asyncio.get_event_loop().run_in_executor(
        executor, extract_librosa_features, data, sr
    )


# Helper functions for calculating syllables speaking rate
def get_word_syllable_count(word):
    """A helper function to get the count of all the syllables from a word

    Args:
        word (str): The word from which syllables count has to be extracted

    Returns:
        int: The total number of syllables in the word
    """
    word = word.lower().strip(".,?!;:")
    if word in cmu_dict:
        return len([p for p in cmu_dict[word][0] if p[-1].isdigit()])
    return max(1, len(re.findall(r'[aeiouy]+', word)))


def estimate_syllable_rate(transcript, duration_sec):
    """A function to estimate the syllables spoken per second from the transcript and the duration of the transcript

    Args:
        transcript (str): The transcript of the entire duration
        duration_sec (float): The total duration that took to speak the entire content in the transcripts

    Returns:
        float: Syllables per second spoken in the given time with the give transcript
    """
    words = transcript.split()
    total_syllables = sum(get_word_syllable_count(word) for word in words)
    return total_syllables / duration_sec if duration_sec > 0 else 0


def extract_features_from_wave(data, sr):
    """
    A function to extract the features of a wave using librosa and parselmouth, synchronously
    """
    return {
        **extract_librosa_features(data, sr),
        **extract_parselmouth_features(data, sr)
    }
 
    
async def async_extract_features_from_wave(data, sr, executor):
    """
    !! Warning: Viability unsure
    An asynchronous function to extract the features of a wave using librosa and parselmouth
    """
    # Start both tasks concurrently
    librosa_task = asyncio.create_task(async_extract_librosa_features(data, sr, executor))
    parselmouth_task = asyncio.create_task(async_extract_parselmouth_features(data, sr, executor))

    # Wait for both
    librosa_feats, parselmouth_feats = await asyncio.gather(librosa_task, parselmouth_task)

    return {**librosa_feats, **parselmouth_feats}


# Full function to extract all the features of the audio file
async def extract_features(audio_path, fluency_model, client: AsyncClient, progress_callback=None):
    """A function to extract all the features from an audio file in order to generate feedback on it

    Args:
        audio_path (str): Path to audio file
        fluency_model (Any, optional): The model to load to get a rough fluency rating
        client (AsyncClient): 
        progress_callback (callable, optional): Callback function to report progress

    Returns:
        dict: A dictionary containing all the features extracted, of baseline, full file and the ratios
    """
    
    # -------------- Load the audio file --------------
    if isinstance(audio_path, io.BytesIO):
        data, sr = sf.read(audio_path)
    else:
        data, sr = sf.read(audio_path)
    
    assert len(data) != 0, "Your audio file appears to contain no content. Please input a valid file"
    
    
    # -------------- Get transcription and check minimum duration --------------
    transcription_json = await transcribe_audio(audio_path, client, progress_callback)
    duration_sec = transcription_json.duration    # type: ignore
    baseline_duration = max(10.0, duration_sec * 0.05)      # Minimum duration for baseline is 10 seconds

    assert duration_sec != 0, "File duration appears to be 0 after transcription?"
    
    
    # -------------- Get features of baseline and full wave --------------
    baseline_data = data[:min(len(data), int(sr * baseline_duration))]
    baseline_feats = extract_features_from_wave(baseline_data, sr)
    full_feats = extract_features_from_wave(data, sr)


    # -------------- Get fluency ratings --------------
    features = ['zcr', 'pitch_mean', 'pitch_std', 'rms_mean', 'rms_std', 'rms_var', 'mfcc_mean', 'delta_mean']
    rating_map = ['Low', 'Medium', 'High']
        
    baseline_fluency_features = np.array([baseline_feats[key] for key in baseline_feats if key in features])
    full_fluency_features = np.array([full_feats[key] for key in full_feats if key in features])

    res = fluency_model.predict(np.vstack((baseline_fluency_features, full_fluency_features)))
    baseline_fluency = rating_map[res[0].argmax()]
    full_fluency = rating_map[res[1].argmax()]

    relative_feats = {}
    for key in full_feats:
        if key not in ['mfcc', 'delta_mfcc']:
            base = baseline_feats.get(key, 0.0)
            full = full_feats[key]
            relative_feats[f'{key}_delta'] = full - base
    
    
    # -------------- Get speaking rates --------------
    # Assuming the transcript has come by now

    # Baseline speaking rate
    baseline_transcript = [word_segment['word'] for word_segment in transcription_json.words if word_segment['start'] <= baseline_duration]  # type: ignore
    baseline_word_count = len(baseline_transcript)
    baseline_transcript = " ".join(baseline_transcript)
    baseline_speaking_rate = baseline_word_count / baseline_duration
    baseline_syllables_rate = estimate_syllable_rate(baseline_transcript, baseline_duration)

    # Full data speaking rate
    transcript = transcription_json.text
    word_count = len(transcript.split())
    speaking_rate = word_count / duration_sec
    syllables_rate = estimate_syllable_rate(transcript, duration_sec)
        
    
    # -------------- Pause detection --------------
    intervals = librosa.effects.split(data, top_db=30)
    pauses = [(intervals[i][0] - intervals[i - 1][1]) / sr
              for i in range(1, len(intervals))
              if (intervals[i][0] - intervals[i - 1][1]) / sr > 1.0]
    
    long_pause_count = len(pauses)
    long_pause_total = sum(pauses)

    return {
        "transcript": transcript,
        "duration": duration_sec,
        "baseline_duration": baseline_duration,
        "speaking_rate": speaking_rate,
        "syllables_rate": syllables_rate,
        "baseline_speaking_rate": baseline_speaking_rate,
        "baseline_syllables_rate": baseline_syllables_rate,
        "long_pause_count": long_pause_count,
        "long_pause_duration": long_pause_total,
        "fluency_rating": full_fluency,
        "baseline_fluency_rating": baseline_fluency,
        **full_feats,
        **{f'baseline_{k}': v for k, v in baseline_feats.items()},
        **relative_feats,
    }

