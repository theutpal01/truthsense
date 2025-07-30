import os
import json
import joblib
import asyncio
from groq import AsyncClient

from utils import calculate_overall_score
from prompt import get_prompt
from audio_utils import extract_features
from schema import PostureFeatures, FrontendResponse

async def get_feedback(audio_path, fluency_model, posture_features: dict | PostureFeatures, response_schema = FrontendResponse, llm_model : str = "llama-3.3-70b-versatile", progress_callback=None, domain: str = "general"):
    """Here, posture features will be gotten from the frontend as a JSON object"""
    # Initialize Groq client with API key from environment
    import os
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in environment variables")
    
    llm_client = AsyncClient(api_key=api_key)
    
    # Progress tracking for feature extraction (20% - 80%)
    def feature_progress_callback(current, total, message):
        if progress_callback:
            # Map transcription progress to our overall progress (20% to 80%)
            progress = 20 + (current / total) * 60
            progress_callback(progress, message)
    
    if progress_callback:
        progress_callback(20, "Extracting audio features...")
    
    audio_features = await extract_features(audio_path, fluency_model, llm_client, feature_progress_callback)
    
    if progress_callback:
        progress_callback(80, "Generating LLM analysis...")
    
    prompt = get_prompt(audio_features, posture_features, response_schema)
    
    completion = await llm_client.chat.completions.create(
        model=llm_model,
        messages=[
        {
            "role": "user",
            "content": prompt
        }
        ],
        temperature=0.5,
        max_completion_tokens=32768,
        top_p=1,
        response_format={"type": "json_object"},
        stream=False,
        stop=None,
    )
    
    if progress_callback:
        progress_callback(95, "Processing results...")
    
    response = json.loads(completion.choices[0].message.content)      # type: ignore
    response['speaking_rate'] = int(audio_features['speaking_rate'] * 60)
    print(response)
    response['overall_score'] = calculate_overall_score(response)
    response['transcript'] = audio_features['transcript']
    
    # Always add info fields - they should be included in every analysis response
    from datetime import datetime
    response['info'] = {
        'category': domain,
        'reportCreated': datetime.utcnow().isoformat()
    }
    
    if progress_callback:
        progress_callback(100, "Analysis complete")
        
    return json.dumps(response, indent=2)