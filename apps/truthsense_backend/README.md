# TruthSense Backend API

A comprehensive Express.js backend for speech and posture analysis platform with email OTP authentication, file upload, background processing, and AI analysis.

## Features

- 🔐 **Email OTP Authentication** - Passwordless login with rate limiting
- 🎤 **Audio Recording Management** - Support for multiple recording domains
- 📤 **File Upload** - Audio file upload with validation and storage
- 🤖 **AI Processing** - Background job processing with Redis queue
- 📊 **Posture Analysis** - Integration with frontend posture detection
- 📚 **Swagger Documentation** - Complete API documentation
- 🛡️ **Security** - Rate limiting, CORS, Helmet security headers
- 🗄️ **Database** - SQLite with Sequelize ORM
- ⚡ **Background Jobs** - Bull queue for async processing

## Quick Start

### 🐳 Docker Deployment (Recommended)

1. Clone the repository
```bash
git clone <repository-url>
cd truthsense_backend
```

2. Configure environment variables
```bash
cp .env.docker .env
# Edit .env with your email configuration
```

3. Start with Docker Compose
```bash
docker-compose up -d
```

The backend will be available at **http://localhost:8002**

### 📋 Manual Installation

#### Prerequisites
- Node.js (v16 or higher)
- Redis server (for background jobs)
- SMTP email service (Gmail, SendGrid, etc.)

#### Steps
1. Clone and install dependencies
```bash
git clone <repository-url>
cd truthsense_backend
npm install
```

2. Configure environment variables
```bash
cp .env.docker .env
# Edit .env with your configuration
```

3. Start Redis server locally
```bash
redis-server
```

4. Start the development server
```bash
npm run dev
```

## Environment Configuration

Create a `.env` file in the root directory:

```env
# Server
PORT=8002
NODE_ENV=development

# Database (SQLite for development)
DB_PATH=./database.sqlite

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Redis (for background jobs)
REDIS_URL=redis://localhost:6379

# Rate Limiting
OTP_RATE_LIMIT_WINDOW=15
OTP_RATE_LIMIT_MAX=5

# File Upload
MAX_FILE_SIZE=50MB
ALLOWED_AUDIO_TYPES=audio/wav,audio/webm,audio/mp3,audio/m4a

# AI Processing
AI_PROCESSING_TIMEOUT=300000
```

## API Documentation

Once the server is running, visit:
- **API Documentation**: http://localhost:8002/api-docs
- **Health Check**: http://localhost:8002/health

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/profile` - Get user profile (requires auth)
- `POST /api/auth/refresh` - Refresh JWT token (requires auth)

### Recordings
- `GET /api/recordings/domains` - Get available recording domains
- `POST /api/recordings` - Create new recording session (requires auth)
- `POST /api/recordings/{id}/start` - Start recording (requires auth)
- `POST /api/recordings/{id}/stop` - Stop recording (requires auth)
- `POST /api/recordings/{id}/upload` - Upload audio + posture data (requires auth)
- `GET /api/recordings/{id}` - Get recording status/results (requires auth)
- `GET /api/recordings` - Get user's recordings (requires auth)
- `POST /api/recordings/{id}/retry` - Reset recording to retry (requires auth)
- `DELETE /api/recordings/{id}` - Delete recording (requires auth)

## Recording Workflow

1. **Create Recording Session**
   ```bash
   curl -X POST http://localhost:8002/api/recordings \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"domain": "speech"}'
   ```

2. **Start Recording**
   ```bash
   curl -X POST http://localhost:8002/api/recordings/{id}/start \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Stop Recording**
   ```bash
   curl -X POST http://localhost:8002/api/recordings/{id}/stop \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Upload Audio + Posture Data**
   ```bash
   curl -X POST http://localhost:8002/api/recordings/{id}/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "audioFile=@recording.wav" \
     -F 'postureFeatures={"headPosition":{"x":0,"y":0,"z":0},"shoulderAlignment":{"leftShoulder":{"x":0,"y":0},"rightShoulder":{"x":0,"y":0}},"spineAlignment":0,"eyeContact":{"percentage":75,"avgDuration":2.5},"gestures":{"handMovements":5,"facialExpressions":3},"confidence":0.8}'
   ```

5. **Check Results**
   ```bash
   curl -X GET http://localhost:8002/api/recordings/{id} \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Data Schemas

### PostureFeatures (Frontend → Backend)
```json
{
  "headPosition": { "x": 0, "y": 0, "z": 0 },
  "shoulderAlignment": {
    "leftShoulder": { "x": 0, "y": 0 },
    "rightShoulder": { "x": 0, "y": 0 }
  },
  "spineAlignment": 0,
  "eyeContact": { "percentage": 75, "avgDuration": 2.5 },
  "gestures": { "handMovements": 5, "facialExpressions": 3 },
  "confidence": 0.8
}
```

### FrontendResponse (Backend → Frontend)
```json
{
  "recordingId": "uuid",
  "status": "processed",
  "analysis": {
    "overall": { "score": 85, "grade": "B+", "summary": "Good performance..." },
    "speechAnalysis": { "clarity": 80, "pace": 75, "volume": 85, "fillerWords": 3 },
    "postureAnalysis": { "posture": 80, "eyeContact": 75, "gestures": 70, "confidence": 85 },
    "recommendations": [...],
    "timestamps": { "goodMoments": [...], "improvementAreas": [...] }
  },
  "processedAt": "2024-01-01T12:00:00Z"
}
```

## Recording Domains

Available domains for analysis:
- `interview` - Job interview scenarios
- `speech` - Public speaking
- `presentation` - Business presentations
- `lecture` - Educational lectures
- `briefing` - Team briefings
- `conference_talk` - Conference presentations
- `monologue` - Solo speaking practice

## File Structure

```
truthsense_backend/
├── config/          # Database and Swagger configuration
├── controllers/     # Request handlers
├── middleware/      # Custom middleware (auth, upload, rate limiting)
├── models/          # Database models (User, OTP, Recording)
├── routes/          # Express routes
├── services/        # Business logic services
├── schemas/         # Joi validation schemas
├── media/           # File storage (audio, temp, processed)
├── .env             # Environment variables
├── .gitignore       # Git ignore rules
├── package.json     # Dependencies and scripts
└── index.js         # Main server file
```

## Development Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test          # Run tests (placeholder)
```

## Background Processing

The system uses Redis and Bull queue for background AI processing:
- Audio files are processed asynchronously
- Recording status updates from 'processing' → 'processed' or 'failed'
- Failed jobs are retried with exponential backoff
- Queue monitoring and cleanup included

## Security Features

- **Rate Limiting**: Configurable limits for OTP, login, uploads, and API calls
- **CORS**: Configured for development and production origins
- **Helmet**: Security headers protection
- **File Validation**: Strict audio file type and size validation
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Joi schema validation for all inputs

## Database Schema

### Users
- `id` (UUID)
- `email` (unique)
- `isVerified`
- `lastLoginAt`
- `createdAt`, `updatedAt`

### OTPs
- `id` (UUID)
- `email`
- `code` (6-digit)
- `expiresAt`
- `isUsed`
- `attempts`
- `createdAt`

### Recordings
- `id` (UUID)
- `userId` (foreign key)
- `domain` (enum)
- `status` (enum: idle, recording, completed, processing, processed, failed)
- `duration`, `startTime`, `endTime`
- `audioFileName`, `audioFilePath`, `audioFileSize`, `mimeType`
- `postureFeatures` (JSON)
- `analysisResult` (JSON)
- `processingStartedAt`, `processedAt`
- `errorMessage`
- `createdAt`, `updatedAt`

## 🐳 Docker Commands

### Development
```bash
# Start services in development mode
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build
```

### Production Deployment

#### With Docker (Recommended)
1. Configure production `.env` file
2. Update CORS origins in `index.js`
3. Deploy with Docker Compose:
```bash
docker-compose up -d --build
```

#### Manual Production Setup
1. Set `NODE_ENV=production`
2. Configure production database (PostgreSQL recommended)
3. Set up Redis cluster for background jobs
4. Configure production email service
5. Set strong JWT secrets
6. Configure CORS for production domains
7. Set up reverse proxy (nginx) with SSL
8. Monitor logs and queue health

### Docker Volumes
- `./data` - Database files
- `./media` - Uploaded audio files
- `./logs` - Application logs

## Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "error": "Error message",
  "retryAfter": 900  // For rate limiting
}
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit pull request

## License

MIT License - see LICENSE file for details.