# TruthSense Backend API Documentation

Base URL: `http://localhost:8001/api` (Development)

## Table of Contents
- [Authentication](#authentication)
- [Recording Endpoints](#recording-endpoints)
- [Response Formats](#response-formats)
- [Error Handling](#error-handling)

---

## Authentication

All recording endpoints require JWT authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### POST /auth/signup

Create a new user account.

**Request:**
```bash
curl -X POST http://localhost:8001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "John Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully. Please verify your email with the OTP sent.",
  "userId": "d882e61f-9ae3-4349-96e7-2339c14da7e0"
}
```

### POST /auth/verify-otp

Verify email with OTP and receive JWT token.

**Request:**
```bash
curl -X POST http://localhost:8001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "d882e61f-9ae3-4349-96e7-2339c14da7e0",
    "email": "user@example.com",
    "isVerified": true,
    "createdAt": "2025-10-22T10:56:54.073Z"
  }
}
```

---

## Recording Endpoints

### GET /recordings/domains

Get available recording domains (no authentication required).

**Request:**
```bash
curl http://localhost:8001/api/recordings/domains
```

**Response:**
```json
{
  "success": true,
  "domains": [
    {
      "id": "interview",
      "label": "Interview",
      "isActive": true
    },
    {
      "id": "speech",
      "label": "Speech",
      "isActive": true
    },
    {
      "id": "presentation",
      "label": "Presentation",
      "isActive": true
    }
  ]
}
```

### POST /recordings

Create a new recording session.

**Request:**
```bash
curl -X POST http://localhost:8001/api/recordings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "interview"
  }'
```

**Response:**
```json
{
  "success": true,
  "recording": {
    "id": "5339f8ec-e8b5-47c0-a36e-badd4c083157",
    "domain": "interview",
    "status": "idle",
    "startTime": "2025-10-22T10:58:25.733Z"
  }
}
```

### POST /recordings/{recordingId}/start

Start a recording session.

**Request:**
```bash
curl -X POST http://localhost:8001/api/recordings/5339f8ec-e8b5-47c0-a36e-badd4c083157/start \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "recording": {
    "id": "5339f8ec-e8b5-47c0-a36e-badd4c083157",
    "status": "recording",
    "startTime": "2025-10-22T10:59:19.555Z"
  }
}
```

### POST /recordings/{recordingId}/stop

Stop a recording session.

**Request:**
```bash
curl -X POST http://localhost:8001/api/recordings/5339f8ec-e8b5-47c0-a36e-badd4c083157/stop \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "recording": {
    "id": "5339f8ec-e8b5-47c0-a36e-badd4c083157",
    "status": "completed",
    "duration": 8,
    "endTime": "2025-10-22T10:59:28.111Z"
  }
}
```

### POST /recordings/{recordingId}/upload

Upload audio file, posture features, and video metadata.

**Required Fields:**
- `audioFile` (file): Audio file in WAV, WebM, MP3, or M4A format
- `postureFeatures` (JSON string): Posture analysis data from frontend
- `secureUrl` (string): Cloudinary secure URL for the video
- `publicId` (string): Cloudinary public ID for the video
- `videoFileSize` (number): Video file size in bytes

**Request:**
```bash
curl -X POST http://localhost:8001/api/recordings/5339f8ec-e8b5-47c0-a36e-badd4c083157/upload \
  -H "Authorization: Bearer <token>" \
  -F 'audioFile=@/path/to/audio.wav;type=audio/wav' \
  -F 'postureFeatures={"eyeContact":{"good":10},"shoulderAlignment":{"aligned":5},"handGestures":{"natural":3},"headBodyAlignment":{"centered":7}}' \
  -F 'secureUrl=https://res.cloudinary.com/demo/video/sample.mp4' \
  -F 'publicId=sample_video_123' \
  -F 'videoFileSize=1024000'
```

**Response:**
```json
{
  "success": true,
  "message": "Recording uploaded successfully. Processing has started.",
  "recording": {
    "id": "5339f8ec-e8b5-47c0-a36e-badd4c083157",
    "status": "processing",
    "audioFileName": "5339f8ec-e8b5-47c0-a36e-badd4c083157_1761130810484.wav"
  }
}
```

**Posture Features Structure:**
```json
{
  "eyeContact": {
    "Eye contact maintained": 45,
    "Looking away": 5
  },
  "shoulderAlignment": {
    "Shoulders well aligned": 40,
    "Shoulders slightly tilted": 10
  },
  "handGestures": {
    "Natural hand gestures": 30,
    "Hands not detected": 20
  },
  "headBodyAlignment": {
    "Head properly aligned with body": 35,
    "Head not centered over shoulders": 15
  }
}
```

### GET /recordings/{recordingId}

Get recording details and analysis results.

**Request:**
```bash
curl http://localhost:8001/api/recordings/5339f8ec-e8b5-47c0-a36e-badd4c083157 \
  -H "Authorization: Bearer <token>"
```

**Response (Processing):**
```json
{
  "success": true,
  "recordingId": "5339f8ec-e8b5-47c0-a36e-badd4c083157",
  "status": "processing"
}
```

**Response (Processed):**
```json
{
  "success": true,
  "recordingId": "b0b0cfc7-132a-42e3-b23c-a529d4e11f66",
  "status": "processed",
  "analysis": {
    "fluency_evaluator": {
      "comment": "The speaker's delivery felt somewhat hesitant...",
      "fluency_score": 70
    },
    "language_evaluator": {
      "strengths": [
        "The speaker's ideas were well-organized and easy to follow.",
        "Grammar and sentence structure were correct and clear."
      ],
      "improvements": [
        "More varied and nuanced vocabulary could enhance the speech.",
        "Adding more specific examples could make the content more engaging."
      ],
      "structure_score": 85,
      "grammar_score": 90
    },
    "speech_evaluator": {
      "strengths": [
        "The speaker's tone was generally appropriate for the topic.",
        "Pronunciation was clear, making the speech easy to understand."
      ],
      "improvements": [
        "Vocal modulation could be more expressive to convey emotion.",
        "Working on projecting the voice could improve confidence."
      ],
      "clarity_score": 80,
      "confidence_score": 75
    },
    "posture_evaluator": {
      "tips": [
        "Maintain steady eye contact with the audience to build trust.",
        "Keep the head centered and straight to project confidence.",
        "Relax the shoulders to appear more at ease and reduce tension."
      ],
      "score": 60
    },
    "speaking_rate": 3,
    "overall_score": 68,
    "transcript": "Full transcript text here...",
    "info": {
      "category": "interview",
      "reportCreated": "2025-10-21T19:32:01.116Z",
      "secureUrl": "https://res.cloudinary.com/demo/video/sample.mp4",
      "publicId": "sample_video_123",
      "videoFileSize": 1024000
    }
  },
  "processedAt": "2025-10-21T19:32:01.116Z"
}
```

### GET /recordings

Get user's recordings list.

**Query Parameters:**
- `limit` (number, optional): Number of recordings to return (default: 10)
- `offset` (number, optional): Number of recordings to skip (default: 0)

**Request:**
```bash
curl http://localhost:8001/api/recordings?limit=10&offset=0 \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "recordings": [
    {
      "id": "e20965ea-dc3e-48bc-9fc3-7343c48f8db3",
      "publicId": "video_xyz_789",
      "domain": "interview",
      "status": "processed",
      "duration": 5,
      "startTime": "2025-10-21T20:51:12.923Z",
      "endTime": "2025-10-21T20:51:18.304Z",
      "createdAt": "2025-10-21T20:51:09.832Z"
    },
    {
      "id": "85ae0844-ac01-44b9-8bac-d4f76a7685b1",
      "publicId": "video_abc_456",
      "domain": "monologue",
      "status": "processed",
      "duration": 12,
      "startTime": "2025-10-21T20:50:06.069Z",
      "endTime": "2025-10-21T20:50:19.031Z",
      "createdAt": "2025-10-21T20:50:05.127Z"
    }
  ],
  "total": 2
}
```

### POST /recordings/{recordingId}/retry

Reset a failed recording to retry.

**Request:**
```bash
curl -X POST http://localhost:8001/api/recordings/5339f8ec-e8b5-47c0-a36e-badd4c083157/retry \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Recording reset successfully. You can start recording again."
}
```

### DELETE /recordings/{recordingId}

Delete a recording.

**Request:**
```bash
curl -X DELETE http://localhost:8001/api/recordings/5339f8ec-e8b5-47c0-a36e-badd4c083157 \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Recording deleted successfully"
}
```

---

## Response Formats

### Recording Status Values

- `idle`: Recording created but not started
- `recording`: Recording in progress
- `completed`: Recording stopped, ready for upload
- `processing`: Audio uploaded, AI processing in progress
- `processed`: AI analysis complete
- `failed`: Processing failed

### Video Metadata Fields

The following fields are now included in the upload and retrieval operations:

| Field | Type | Description |
|-------|------|-------------|
| `secureUrl` | String | Cloudinary secure URL for the video (HTTPS) |
| `publicId` | String | Cloudinary public identifier for the video |
| `videoFileSize` | Number | Video file size in bytes |

These fields are:
- **Required** in POST `/recordings/{recordingId}/upload` request
- **Returned** in GET `/recordings/{recordingId}` response under `analysis.info`
- **Included** in GET `/recordings` response as `publicId` for each recording

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters or validation error
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Common Error Scenarios

**Invalid Token:**
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Validation error: \"secureUrl\" is required"
}
```

**Recording Not Found:**
```json
{
  "success": false,
  "error": "Recording not found"
}
```

**Invalid File Type:**
```json
{
  "success": false,
  "error": "Invalid file type. Allowed types: audio/wav, audio/webm, video/webm, audio/mp3, audio/m4a"
}
```

---

## Complete Workflow Example

### Step-by-Step Recording Flow

```bash
# 1. Sign up
curl -X POST http://localhost:8001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","name":"John"}'

# 2. Verify OTP (get from email or database)
curl -X POST http://localhost:8001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","code":"123456"}'

# Save the token from response
TOKEN="eyJhbGci..."

# 3. Create recording
RECORDING=$(curl -s -X POST http://localhost:8001/api/recordings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain":"interview"}')

RECORDING_ID=$(echo $RECORDING | jq -r '.recording.id')

# 4. Start recording
curl -X POST "http://localhost:8001/api/recordings/$RECORDING_ID/start" \
  -H "Authorization: Bearer $TOKEN"

# ... User records audio/video ...

# 5. Stop recording
curl -X POST "http://localhost:8001/api/recordings/$RECORDING_ID/stop" \
  -H "Authorization: Bearer $TOKEN"

# 6. Upload with video metadata
curl -X POST "http://localhost:8001/api/recordings/$RECORDING_ID/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F 'audioFile=@recording.wav;type=audio/wav' \
  -F 'postureFeatures={"eyeContact":{"good":10},"shoulderAlignment":{"aligned":5},"handGestures":{"natural":3},"headBodyAlignment":{"centered":7}}' \
  -F 'secureUrl=https://res.cloudinary.com/demo/video/sample.mp4' \
  -F 'publicId=my_video_123' \
  -F 'videoFileSize=2048000'

# 7. Poll for results
curl "http://localhost:8001/api/recordings/$RECORDING_ID" \
  -H "Authorization: Bearer $TOKEN"

# 8. Get all recordings
curl "http://localhost:8001/api/recordings" \
  -H "Authorization: Bearer $TOKEN"
```

---

## API Documentation (Swagger)

Interactive API documentation is available at: **http://localhost:8001/api-docs**

The Swagger UI provides:
- Complete API schema
- Request/response examples
- Try-it-out functionality
- Authentication testing

---

## Rate Limiting

- **OTP Requests**: 5 requests per 15 minutes per IP
- **Login Requests**: 10 requests per 15 minutes per IP
- **Upload Requests**: 10 requests per 15 minutes per user

---

## Notes

1. **File Upload**: Audio files must be in WAV, WebM, MP3, or M4A format with proper MIME type
2. **Video Metadata**: All three fields (secureUrl, publicId, videoFileSize) are required in upload
3. **Processing Time**: AI processing may take 30 seconds to several minutes depending on audio length
4. **Token Expiry**: JWT tokens expire after 24 hours by default
5. **Database Migration**: The new video metadata fields require database columns (already added in production)

---

**Last Updated**: October 22, 2025
**API Version**: 1.0.0
