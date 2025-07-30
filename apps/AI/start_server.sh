#!/bin/bash

# TruthSense AI Service Startup Script

# Set script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Default values
AI_SERVER_HOST=${AI_SERVER_HOST:-127.0.0.1}
AI_SERVER_PORT=${AI_SERVER_PORT:-8003}

echo "🚀 Starting TruthSense AI Service..."
echo "📍 Host: $AI_SERVER_HOST"
echo "🔌 Port: $AI_SERVER_PORT"

# Check if required files exist
if [ ! -f "fluency_model.pkl" ]; then
    echo "❌ Error: fluency_model.pkl not found!"
    exit 1
fi

if [ ! -f "ai_server.py" ]; then
    echo "❌ Error: ai_server.py not found!"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "📦 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Start the server
echo "🎯 Starting AI service server..."
python ai_server.py