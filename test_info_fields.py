#!/usr/bin/env python3
"""
Test script to verify info fields are included in AI analysis response
"""

import json
import asyncio
import sys
import os

# Add the AI directory to the path
sys.path.append('/Users/sarveshdakhore/Desktop/GDSC/truthsense/apps/AI')

from main import get_feedback
from schema import PostureFeatures, FrontendResponse
import joblib
import io

async def test_info_fields():
    try:
        # Load the model
        model_path = '/Users/sarveshdakhore/Desktop/GDSC/truthsense/apps/AI/fluency_model.pkl'
        fluency_model = joblib.load(model_path)
        
        # Mock posture features
        posture_features = {
            "eyeContact": {"percentage": 0.75},
            "confidence": 0.8
        }
        
        # Create a mock audio path (you can replace this with a real audio file path)
        # For now, let's use a tiny mock audio buffer
        mock_audio = io.BytesIO(b"mock_audio_data")
        
        print("Testing get_feedback with info fields...")
        
        # Call the function with a domain
        result = await get_feedback(
            audio_path=mock_audio,
            fluency_model=fluency_model,
            posture_features=posture_features,
            response_schema=FrontendResponse,
            domain="test_presentation"
        )
        
        # Parse the result
        response_dict = json.loads(result)
        
        # Check if info fields are present
        print("Analysis response keys:", list(response_dict.keys()))
        
        if 'info' in response_dict:
            print("✅ Info field found!")
            print("Info contents:", response_dict['info'])
            
            # Check required fields
            if 'category' in response_dict['info'] and 'reportCreated' in response_dict['info']:
                print("✅ Both category and reportCreated fields are present")
                print(f"Category: {response_dict['info']['category']}")
                print(f"Report Created: {response_dict['info']['reportCreated']}")
            else:
                print("❌ Missing required info fields")
                
        else:
            print("❌ Info field not found in response")
            
        return response_dict
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("Starting info fields test...")
    result = asyncio.run(test_info_fields())
    
    if result and 'info' in result:
        print("\n✅ Test passed! Info fields are working correctly.")
    else:
        print("\n❌ Test failed! Info fields are missing.")