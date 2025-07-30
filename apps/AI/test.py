import os
import io
import json
import joblib
import asyncio
from groq import AsyncClient

from utils import calculate_overall_score
from prompt import get_prompt
from audio_utils import extract_features
from schema import PostureFeatures, FrontendResponse

async def get_feedback(audio_path, fluency_model, posture_features: dict | PostureFeatures, response_schema = FrontendResponse, llm_model : str = "llama-3.3-70b-versatile", domain: str = "general"):
    from load_dotenv import load_dotenv
    from datetime import datetime
    load_dotenv(".env.local")

    """Here, posture features will be gotten from the frontend as a JSON object"""
    llm_client = AsyncClient()
    
    audio_features = await extract_features(audio_path, fluency_model, llm_client)
    
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
    
    response = json.loads(completion.choices[0].message.content)      # type: ignore
    response['speaking_rate'] = int(audio_features['speaking_rate'] * 60)
    print(response)
    response['overall_score'] = calculate_overall_score(response)
    response['transcript'] = audio_features['transcript']
    
    # Add required info fields
    response['info'] = {
        'category': domain,
        'reportCreated': datetime.utcnow().isoformat()
    }
        
    return json.dumps(response, indent=2)


# For testing purposes
if __name__ == "__main__":

    """
    We'll need these two global variables to be defined when a new session has started, just like the session ID
    """
    fluency_model = joblib.load('./fluency_model.pkl')

    posture_features = {}

    sample_name = "tim-urban"
    with open(f"./samples/{sample_name}.wav", "rb") as f:
        f.seek(0)
        byte_data = f.read()
    
    feedback = asyncio.run(get_feedback(io.BytesIO(byte_data), fluency_model, posture_features, response_schema=FrontendResponse, domain="test"))
    output_file = f"./outputs/{sample_name}.json"
    
    if not os.path.exists("./outputs/"): os.mkdir("./outputs/")
    try:
        with open(output_file, "x+") as f:
            f.write(feedback)
    except FileExistsError:
        with open(output_file, "w+") as f:
            f.write(feedback)

    print(feedback)