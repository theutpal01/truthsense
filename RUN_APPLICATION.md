# TruthSense Application Setup Guide

This guide explains how to run the complete TruthSense application, which consists of three main components: Frontend, Backend, and AI Service.

## Prerequisites

- Node.js (v18+ recommended)
- Python 3.x (Note: Python 3.13 may have issues with lzma module)
- Docker and Docker Compose
- Redis (will run in Docker)
- PostgreSQL (will run in Docker)

## Environment Setup

### 1. Backend Environment Variables

Create `/apps/truthsense_backend/.env` file:

```env
# Database
DATABASE_URL=postgresql://truthsense:truthsense@localhost:5432/truthsense_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# JWT
JWT_SECRET=your-secret-key-here

# AI Service
AI_SERVICE_URL=http://127.0.0.1:8003

# Server
PORT=8002
```

### 2. AI Service Environment Variables

Create `/apps/AI/.env.local` file:

```env
# Groq API Key (required for transcription and LLM)
GROQ_API_KEY=your-groq-api-key-here

# Server Configuration
AI_SERVER_HOST=127.0.0.1
AI_SERVER_PORT=8003
```

### 3. Frontend Environment Variables

The frontend should already be configured to connect to the backend at `http://localhost:8002`.

## Running the Application

### Step 1: Start Backend Services (Docker)

```bash
cd apps/truthsense_backend
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6380

### Step 2: Setup Backend

```bash
cd apps/truthsense_backend

# Install dependencies
npm install

# Run database migrations
npm run migrate

# Start the backend server
npm run dev
```

The backend will be available at `http://localhost:8002`

### Step 3: Start AI Service

```bash
cd apps/AI

# Install Python dependencies
pip install -r requirements.txt

# Additional dependencies that might be needed
pip install xgboost
brew install libomp  # For macOS users

# Start the AI server
python ai_server.py
```

The AI service will be available at `http://localhost:8003`

### Step 4: Start Frontend

```bash
cd apps/truthsense_frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Application Flow

1. **User Registration/Login**: Users create an account or login through the frontend
2. **Recording Creation**: User selects a domain and starts a recording session
3. **Audio Upload**: Frontend captures audio and posture data, then uploads to backend
4. **Background Processing**: Backend queues the recording for AI analysis
5. **AI Analysis**: AI service processes the audio (transcription, fluency analysis, etc.)
6. **Results**: Analysis results are saved to database and returned to frontend

## API Endpoints

### Backend Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/recordings/domains` - Get available recording domains
- `POST /api/recordings` - Create new recording session
- `POST /api/recordings/:id/upload` - Upload audio and posture data
- `GET /api/recordings/:id` - Get recording status and results

### AI Service Endpoints
- `GET /health` - Health check
- `POST /analyze` - Submit audio for analysis
- `GET /status/:recording_id` - Check analysis job status
- `GET /jobs` - List all processing jobs (debug)

## Troubleshooting

### Common Issues

1. **Redis Connection Error**
   - Make sure Redis is running on port 6380
   - Check docker-compose logs: `docker-compose logs redis`

2. **Database Connection Error**
   - Ensure PostgreSQL is running
   - Check credentials in .env file
   - Run migrations: `npm run migrate`

3. **AI Service Not Available**
   - Check if AI service is running on port 8003
   - Verify GROQ_API_KEY is set in .env.local
   - Check AI service logs for errors

4. **Python lzma Module Error**
   - This is a known issue with Python 3.13
   - Consider using Python 3.11 or 3.12 instead
   - Install xz: `brew install xz` (macOS)

5. **Audio File Upload Issues**
   - Ensure the audio file is in WAV format
   - Check file permissions in media directory
   - Verify multer middleware is configured correctly

### Testing the Integration

Test the complete flow:
```bash
# Test AI service health
curl http://localhost:8003/health

# Test backend-AI integration
curl http://localhost:8002/api/test/ai-integration

# Check environment configuration
curl http://localhost:8002/api/test/config
```

## Development Tips

1. **Logs**: Check logs for each service:
   - Backend: Console output or logs in `logs/` directory
   - AI Service: `ai_server.log` or console output
   - Frontend: Browser console

2. **Database**: Connect to PostgreSQL:
   ```bash
   docker exec -it truthsense-postgres psql -U truthsense truthsense_db
   ```

3. **Redis**: Monitor Redis:
   ```bash
   docker exec -it truthsense-redis redis-cli -p 6380
   ```

4. **API Testing**: Use tools like Postman or curl to test endpoints directly

## Production Considerations

- Use proper environment variables for production
- Enable HTTPS for all services
- Use a process manager (PM2, systemd) for backend and AI service
- Configure proper CORS settings
- Set up monitoring and logging
- Use production builds for frontend
- Configure proper database backups