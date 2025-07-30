# TruthSense - AI-Powered Speech & Posture Analysis

TruthSense is a comprehensive application that analyzes speech patterns and posture to provide detailed feedback for presentations, interviews, and public speaking.

## Architecture

- **Frontend**: Next.js application with real-time audio recording and posture analysis
- **Backend**: Node.js/Express API with Redis-based background job processing  
- **AI Service**: Python FastAPI service with speech analysis and transcription
- **Database**: SQLite with Sequelize ORM

## Services

### 1. Frontend (Next.js)
- Real-time audio recording
- MediaPipe-based posture analysis  
- Interactive feedback visualization
- Authentication and user management

### 2. Backend (Node.js)
- RESTful API endpoints
- File upload and storage
- Background job processing with Bull/Redis
- User authentication with JWT
- Atomic database transactions

### 3. AI Service (Python)
- Speech transcription with Groq/Whisper
- Audio feature extraction with librosa
- Posture analysis integration
- LLM-powered feedback generation
- Timeout handling and retry logic

## Apps and Packages

- `apps/frontend`: Next.js frontend application
- `apps/truthsense_backend`: Node.js/Express backend API
- `apps/AI`: Python FastAPI AI analysis service

Each service is designed to work independently with clear API boundaries.

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Redis server
- Groq API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd truthsense
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Backend (.env):
   ```bash
   cp apps/truthsense_backend/.env.example apps/truthsense_backend/.env
   # Edit with your configuration
   ```
   
   AI Service (.env):
   ```bash
   cp apps/AI/.env.example apps/AI/.env  
   # Add your GROQ_API_KEY
   ```

4. **Start Redis server**
   ```bash
   redis-server
   ```

5. **Start the AI service**
   ```bash
   cd apps/AI
   ./start_server.sh
   ```

6. **Start the backend**
   ```bash
   cd apps/truthsense_backend
   npm run dev
   ```

7. **Start the frontend**
   ```bash
   cd apps/frontend
   npm run dev
   ```

### Development

To develop all apps and packages, run the following command:

```bash
npm run dev  # Starts all services with turbo
```

### Build

To build all apps and packages:

```bash
npm run build
```

### API Endpoints

#### Backend (Port 8002)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/recordings` - Create recording session
- `POST /api/recordings/:id/upload` - Upload audio + posture data
- `GET /api/recordings/:id` - Get analysis results

#### AI Service (Port 8003)  
- `POST /analyze` - Submit audio for analysis
- `GET /status/:recording_id` - Check analysis progress
- `GET /health` - Service health check

## Audio Processing Flow

1. **Frontend** records audio and captures posture data
2. **Backend** receives upload, saves files, queues AI job
3. **AI Service** processes audio with timeout handling:
   - Splits large files into chunks
   - Transcribes with retry logic  
   - Extracts speech features
   - Generates LLM feedback
4. **Backend** polls for completion, updates database atomically
5. **Frontend** displays comprehensive analysis results

## Key Features

### Improved Reliability
- **Timeout Handling**: Transcription requests have configurable timeouts with exponential backoff
- **Retry Logic**: Failed chunks are retried up to 3 times
- **Atomic Transactions**: Database updates are atomic to prevent inconsistent states
- **Progress Tracking**: Real-time progress updates during processing

### Speech Analysis
- Transcription accuracy with Groq's Whisper-large-v3
- Speech rate, clarity, and fluency analysis
- Pause detection and filler word counting
- Pronunciation and articulation feedback

### Posture Analysis  
- Real-time posture tracking with MediaPipe
- Eye contact percentage calculation
- Gesture and confidence scoring
- Integrated feedback with speech analysis

## Environment Variables

### Backend
- `AI_SERVICE_URL`: URL of Python AI service (default: http://127.0.0.1:8003)
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT tokens
- `DB_PATH`: SQLite database path

### AI Service  
- `GROQ_API_KEY`: Required Groq API key
- `AI_SERVER_HOST`: Server host (default: 127.0.0.1)
- `AI_SERVER_PORT`: Server port (default: 8003)

## Troubleshooting

### Transcription Timeouts
- Increase timeout values in `audio_utils.py`
- Check Groq API rate limits
- Verify network connectivity

### Processing Failures
- Check Redis connection
- Verify file permissions for audio storage
- Monitor AI service logs

### Database Issues
- Ensure SQLite file is writable
- Check transaction logs for deadlocks
- Verify model associations are correct
