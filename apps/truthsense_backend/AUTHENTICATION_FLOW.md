# TruthSense Authentication Flow Documentation

## Overview
TruthSense uses a hybrid authentication system supporting both password-based authentication with email verification and legacy OTP-only login for backward compatibility.

---

## Table of Contents
1. [User Signup Flow](#user-signup-flow)
2. [User Login Flow](#user-login-flow)
3. [Email Verification (OTP)](#email-verification-otp)
4. [Password Reset Flow](#password-reset-flow)
5. [Legacy OTP-Only Login](#legacy-otp-only-login)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Error Handling](#error-handling)

---

## User Signup Flow

### Process
1. User provides **name**, **email**, and **password**
2. System checks if email is already registered:
   - **If user exists AND is verified**: Return error "User already exists and is verified. Please login instead."
   - **If user exists BUT is NOT verified**: Update user's name and password, then resend OTP
   - **If user is new**: Create account and send verification OTP
3. User receives OTP via email (6-digit code, valid for 10 minutes)
4. User must verify email with OTP to activate account

### Special Case: Unverified User Re-signup
If a user previously signed up but never verified their email, they can sign up again with the same email. The system will:
- Update their name and password with the new values
- Resend a fresh verification OTP
- **No error is thrown** - this is intentional to allow users to retry signup

### Endpoint
**POST** `/api/auth/signup`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com",
  "password": "mySecurePassword123"
}
```

**Validation:**
- `name`: String, 2-100 characters, required
- `email`: Valid email format, required
- `password`: Minimum 8 characters, required

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully. Please verify your email with the OTP sent.",
  "userId": "uuid-here"
}
```

**Or (for unverified user update):**
```json
{
  "success": true,
  "message": "Account updated. Please verify your email with the OTP sent.",
  "userId": "uuid-here"
}
```

**Error Responses:**
- `400`: Validation error or "User already exists and is verified. Please login instead."
- `500`: Internal server error

---

## User Login Flow

### Process
1. User provides **email** and **password**
2. System validates credentials
3. System checks if email is verified:
   - **If not verified**: Return error "Please verify your email first"
   - **If verified**: Generate JWT token and return user data
4. User is logged in with JWT token

### Endpoint
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "mySecurePassword123"
}
```

**Validation:**
- `email`: Valid email format, required
- `password`: Minimum 8 characters, required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "isVerified": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Validation error
- `401`: Invalid email or password, or email not verified
- `500`: Internal server error

---

## Email Verification (OTP)

### OTP Verification Process
After signup, users must verify their email by entering the OTP sent to them.

### Endpoint
**POST** `/api/auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Validation:**
- `email`: Valid email format, required
- `code`: Exactly 6 digits, required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "isVerified": true,
    "createdAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid or expired OTP
- `500`: Internal server error

**OTP Details:**
- **Validity**: 10 minutes from generation
- **Format**: 6-digit numeric code
- **Security**: Marked as used after successful verification
- **Development Mode**: Currently hardcoded to "000000" for testing (see line 47 in authService.js)

---

## Password Reset Flow

### Process
1. User requests password reset by providing email
2. System sends OTP to email
3. User verifies OTP and provides new password
4. Password is updated

### Step 1: Request Password Reset
**POST** `/api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset OTP sent to your email"
}
```

**Error Responses:**
- `400`: Email not found
- `500`: Internal server error

### Step 2: Reset Password with OTP
**POST** `/api/auth/reset-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "myNewSecurePassword123"
}
```

**Validation:**
- `email`: Valid email format, required
- `code`: Exactly 6 digits, required
- `newPassword`: Minimum 8 characters, required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400`: Invalid or expired OTP
- `500`: Internal server error

---

## Legacy OTP-Only Login

### Note
This is kept for backward compatibility. New implementations should use password-based signup/login.

### Process
1. User requests OTP by providing email
2. System sends OTP (creates user if doesn't exist)
3. User verifies OTP to login

### Step 1: Request OTP
**POST** `/api/auth/send-otp`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "email": "user@example.com"
}
```

### Step 2: Verify OTP
Use the same `/api/auth/verify-otp` endpoint as described in the Email Verification section.

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Create new user account | No |
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/verify-otp` | Verify email with OTP | No |
| POST | `/api/auth/forgot-password` | Request password reset OTP | No |
| POST | `/api/auth/reset-password` | Reset password with OTP | No |
| POST | `/api/auth/send-otp` | Legacy: Request OTP for login | No |
| GET | `/api/auth/profile` | Get current user profile | Yes |
| POST | `/api/auth/refresh` | Refresh JWT token | Yes |

### User Profile
**GET** `/api/auth/profile`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "isVerified": true,
    "lastLoginAt": "2025-01-15T10:30:00.000Z",
    "createdAt": "2025-01-10T08:00:00.000Z"
  }
}
```

### Token Refresh
**POST** `/api/auth/refresh`

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error message or business logic error"
}
```

**Common Causes:**
- Invalid email format
- Password too short (< 8 characters)
- Name too short (< 2 characters) or too long (> 100 characters)
- Invalid or expired OTP
- Email already registered (for verified users)
- Email not verified

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Or:**
```json
{
  "success": false,
  "error": "Access token required"
}
```

**Common Causes:**
- Invalid credentials
- Missing authorization header
- Invalid or expired JWT token

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

**Causes:**
- JWT token verification failed

#### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

**Causes:**
- Rate limiting triggered
- OTP limit: Max requests within time window
- Login limit: Max login attempts

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Security Features

### Password Security
- **Hashing Algorithm**: bcrypt with 12 salt rounds
- **Minimum Length**: 8 characters
- **Storage**: Never stored in plaintext

### JWT Tokens
- **Algorithm**: HS256
- **Expiration**: 24 hours (configurable via `JWT_EXPIRES_IN` env variable)
- **Secret**: Stored in environment variable `JWT_SECRET`

### OTP Security
- **Validity**: 10 minutes
- **Length**: 6 digits
- **One-time Use**: Marked as used after verification
- **Attempts Tracking**: Failed attempts are logged
- **Cleanup**: Expired OTPs are automatically cleaned up

### Rate Limiting
- **OTP Endpoints**: Protected with `otpLimiter`
- **Login Endpoints**: Protected with `loginLimiter`
- Prevents brute force attacks

---

## Database Schema

### User Model
```javascript
{
  id: UUID (Primary Key),
  name: String (nullable),
  email: String (unique, not null),
  password: String (hashed, nullable),
  isVerified: Boolean (default: false),
  lastLoginAt: Date (nullable),
  createdAt: Date,
  updatedAt: Date
}
```

### OTP Model
```javascript
{
  id: UUID (Primary Key),
  email: String (not null),
  code: String (6 digits),
  expiresAt: Date,
  isUsed: Boolean (default: false),
  attempts: Integer (default: 0),
  createdAt: Date
}
```

---

## Environment Variables

Required environment variables for authentication:

```env
# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Email Configuration (for OTP sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@truthsense.com
```

---

## Flow Diagrams

### Signup Flow
```
User submits name, email, password
    ↓
Validate input
    ↓
Check if email exists
    ↓
├─ Exists & Verified → Error: "Please login instead"
├─ Exists & Not Verified → Update name/password, Resend OTP
└─ New User → Create account, Send OTP
    ↓
User receives OTP email
    ↓
User verifies OTP
    ↓
Account activated, JWT token issued
```

### Login Flow
```
User submits email, password
    ↓
Validate credentials
    ↓
Check if verified
    ↓
├─ Not Verified → Error: "Please verify your email first"
└─ Verified → Generate JWT token
    ↓
Return token and user data
```

---

## Best Practices

### For Frontend Developers
1. **Store JWT securely**: Use httpOnly cookies or secure localStorage
2. **Handle token expiration**: Implement token refresh logic
3. **Validate input client-side**: Before sending to API
4. **Show clear error messages**: Help users understand what went wrong
5. **Implement loading states**: During async authentication operations

### For Backend Developers
1. **Never log sensitive data**: Passwords, tokens, OTPs should not appear in logs
2. **Use environment variables**: For all secrets and configuration
3. **Implement rate limiting**: On all authentication endpoints
4. **Monitor failed attempts**: Track suspicious activity
5. **Keep dependencies updated**: Especially security-related packages

---

## Troubleshooting

### "Email already registered" error for unverified user
**Issue**: This should no longer occur. If it does, check that authService.signup() properly handles unverified users.

### OTP not received
**Possible causes:**
- Email service configuration incorrect
- Email in spam folder
- OTP already expired (10 minutes validity)

### "Please verify your email first" on login
**Solution**: User must verify email via OTP before logging in. They can request a new OTP by signing up again with the same email.

### Token expired
**Solution**: Use the `/api/auth/refresh` endpoint to get a new token, or ask user to login again.

---

## Changelog

### Version 1.1 (Current)
- Added `name` field to user signup
- Implemented smart unverified user handling (no error on re-signup)
- Updated documentation

### Version 1.0
- Initial password-based authentication
- OTP verification
- Password reset flow
- Legacy OTP-only login support
