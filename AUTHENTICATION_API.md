# TruthSense Authentication API Documentation

## Overview

TruthSense provides a comprehensive authentication system with multiple flows to accommodate different user preferences and security requirements.

## Authentication Flows

### 1. Standard Signup & Login Flow (Recommended)
```
User Registration → Email Verification → Standard Login
```

### 2. Password Reset Flow
```
Forgot Password → OTP Verification → Password Reset
```

### 3. Legacy OTP-Only Login (Backward Compatibility)
```
Send OTP → Verify OTP → Login
```

---

## API Endpoints

Base URL: `http://localhost:3000/api/auth`

### 1. User Signup

**Endpoint**: `POST /api/auth/signup`

**Description**: Register a new user with email and password. An OTP is sent for email verification.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "mySecurePassword123"
}
```

**Example curl**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "mySecurePassword123"
  }'
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "User created successfully. Please verify your email with the OTP sent.",
  "userId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "error": "Email already registered"
}
```

---

### 2. Email Verification (After Signup)

**Endpoint**: `POST /api/auth/verify-otp`

**Description**: Verify email address using OTP sent during signup.

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Example curl**:
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "code": "000000"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

---

### 3. Standard Login

**Endpoint**: `POST /api/auth/login`

**Description**: Login with email and password (no OTP required).

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "mySecurePassword123"
}
```

**Example curl**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "mySecurePassword123"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "isVerified": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (401)**:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Error Response (401) - Unverified Email**:
```json
{
  "success": false,
  "error": "Please verify your email first"
}
```

---

### 4. Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`

**Description**: Request password reset OTP for registered email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Example curl**:
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "error": "Email not found"
}
```

---

### 5. Reset Password

**Endpoint**: `POST /api/auth/reset-password`

**Description**: Reset password using OTP received via email.

**Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "myNewSecurePassword456"
}
```

**Example curl**:
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "code": "000000",
    "newPassword": "myNewSecurePassword456"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

---

### 6. Get User Profile

**Endpoint**: `GET /api/auth/profile`

**Description**: Get current user profile information (requires authentication).

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Example curl**:
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "isVerified": true,
    "lastLoginAt": "2024-01-15T14:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (401)**:
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### 7. Refresh Token

**Endpoint**: `POST /api/auth/refresh`

**Description**: Get a new JWT token (requires authentication).

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Example curl**:
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Legacy OTP-Only Authentication

### 8. Send OTP (Legacy)

**Endpoint**: `POST /api/auth/send-otp`

**Description**: Send OTP for legacy OTP-only authentication.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Example curl**:
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "email": "john.doe@example.com"
}
```

---

## Complete User Flows

### Flow 1: New User Registration & Login

```bash
# Step 1: Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "password": "securePassword123"}'

# Step 2: Verify Email (check email for OTP)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "code": "000000"}'

# Step 3: Future logins (no OTP needed)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "password": "securePassword123"}'
```

### Flow 2: Password Reset

```bash
# Step 1: Request password reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Step 2: Reset password with OTP
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "code": "000000", "newPassword": "newSecurePassword456"}'

# Step 3: Login with new password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "newSecurePassword456"}'
```

### Flow 3: Using Protected Endpoints

```bash
# Get user profile
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"

# Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## Error Handling

### Common Error Responses

**Validation Error (400)**:
```json
{
  "success": false,
  "error": "\"password\" length must be at least 8 characters long"
}
```

**Rate Limit Error (429)**:
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

**Server Error (500)**:
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Security Features

- **Password Hashing**: bcryptjs with 12 salt rounds
- **JWT Tokens**: 24-hour expiration (configurable)
- **Rate Limiting**: Protects against brute force attacks
- **OTP Expiration**: 10-minute validity
- **Email Verification**: Required for account activation
- **Input Validation**: Joi schema validation for all inputs
- **Secure Headers**: Helmet.js middleware for security headers

---

## Notes

1. **OTP for Development**: Currently set to `000000` for testing (line 37 in `authService.js`)
2. **Email Service**: Make sure email service is configured for OTP delivery
3. **JWT Secret**: Ensure `JWT_SECRET` is set in environment variables
4. **Database**: SQLite database with Sequelize ORM
5. **CORS**: Configured for cross-origin requests

---

## Environment Variables Required

```env
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
EMAIL_SERVICE_CONFIG=your-email-config
```

---

*For testing purposes, the OTP is currently hardcoded as `000000`. In production, this should be replaced with the actual OTP generation.*