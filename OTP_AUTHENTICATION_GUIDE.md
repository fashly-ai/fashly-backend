# 🔐 OTP Authentication System Guide

This guide explains the new email-based OTP (One-Time Password) authentication system implemented in the Fashionfy Demo Integration API.

## 📋 Overview

The OTP authentication system provides a secure, passwordless authentication flow where users receive a 6-digit verification code via email. The system automatically handles both sign-in for existing users and sign-up for new users.

## 🏗️ Architecture

### Components

1. **OTP Entity** (`src/database/entities/otp.entity.ts`)
   - Stores OTP codes with expiration and usage tracking
   - Supports both signin and signup flows
   - Automatic cleanup of expired codes

2. **Email Service** (`src/auth/services/email.service.ts`)
   - Sends OTP codes via SMTP
   - Uses free test SMTP server for development
   - Beautiful HTML email templates

3. **OTP Service** (`src/auth/services/otp.service.ts`)
   - Generates and validates OTP codes
   - Rate limiting and security features
   - Automatic cleanup of expired codes

4. **Auth Endpoints** (`src/auth/auth.controller.ts`)
   - `POST /auth/sign-in` - Request OTP code
   - `POST /auth/sign-in-verify` - Verify OTP and get JWT

## 🔄 Authentication Flow

### Step 1: Request OTP Code
```http
POST /auth/sign-in
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "type": "signin", // or "signup" for new users
  "email": "u***@example.com"
}
```

### Step 2: Verify OTP Code
```http
POST /auth/sign-in-verify
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "isNewUser": false
}
```

## 🔧 Configuration

### Environment Variables

```env
# Email Configuration
USE_TEST_SMTP=true                    # Use free test SMTP for development
SMTP_FROM=noreply@fashionfy.com      # From email address

# Production SMTP (when USE_TEST_SMTP=false)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OTP Configuration
OTP_EXPIRY_MINUTES=10                # OTP expiration time
OTP_MAX_ATTEMPTS=3                   # Maximum verification attempts
OTP_LENGTH=6                         # OTP code length
OTP_CLEANUP_INTERVAL=3600000         # Cleanup interval in milliseconds
```

### Test SMTP Server

For development and testing, the system uses a free SMTP server:
- **Host:** `smtp.freesmtpservers.com`
- **Port:** `25`
- **Auth:** None required
- **Features:** Catches all emails, viewable online, auto-deletes after 48 hours

## 🔒 Security Features

### OTP Security
- **Expiration:** OTP codes expire after 10 minutes
- **Single Use:** Each code can only be used once
- **Rate Limiting:** Prevents spam requests (1 minute cooldown)
- **Attempt Limiting:** Maximum 3 verification attempts per code
- **Auto Cleanup:** Expired codes are automatically removed

### Email Privacy
- **Masked Display:** Email addresses are masked in responses (e.g., `u***@example.com`)
- **Secure Templates:** HTML email templates with security warnings
- **No Password Storage:** No passwords stored for OTP-based users

### Database Security
- **Indexed Queries:** Optimized database queries with proper indexing
- **Enum Types:** PostgreSQL enums for type safety
- **UUID Primary Keys:** Secure, non-sequential identifiers

## 📧 Email Templates

### OTP Email Features
- **Responsive Design:** Works on all devices
- **Security Warnings:** Clear instructions about code usage
- **Branding:** Fashionfy branded templates
- **Accessibility:** Screen reader friendly

### Email Content
- 6-digit verification code prominently displayed
- Clear expiration time (10 minutes)
- Security warnings about not sharing the code
- Instructions for use

## 🛠️ API Endpoints

### POST /auth/sign-in

**Description:** Initiates the authentication process by sending an OTP code to the provided email.

**Request Body:**
```typescript
{
  email: string; // Valid email address
}
```

**Responses:**
- `200` - OTP sent successfully
- `400` - Invalid email format
- `429` - Too many requests (rate limited)

### POST /auth/sign-in-verify

**Description:** Verifies the OTP code and completes authentication.

**Request Body:**
```typescript
{
  email: string; // Email address
  code: string;  // 6-digit OTP code
}
```

**Responses:**
- `200` - Authentication successful (returns JWT)
- `400` - Invalid OTP code or email
- `401` - OTP verification failed

## 🔄 User Flow Examples

### Existing User Sign-In
1. User enters email → System detects existing user
2. Sends "Sign In" OTP email
3. User enters OTP → Returns JWT token
4. User is authenticated

### New User Sign-Up
1. User enters email → System detects new user
2. Sends "Welcome" OTP email
3. User enters OTP → Creates new account + Returns JWT token
4. Sends welcome email
5. User is authenticated

## 🧪 Testing

### Development Testing
```bash
# Start the development server
pnpm run start:dev

# Test sign-in endpoint
curl -X POST http://localhost:3001/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check server logs for OTP code
# Then test verification
curl -X POST http://localhost:3001/auth/sign-in-verify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}'
```

### Email Testing
- **Development:** OTP codes are logged to console
- **Test SMTP:** Emails are sent to `smtp.freesmtpservers.com`
- **Production:** Configure your own SMTP provider

## 📊 Database Schema

### OTP Table Structure
```sql
CREATE TABLE "otps" (
    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" varchar NOT NULL,
    "code" varchar(6) NOT NULL,
    "type" enum('signin', 'signup') NOT NULL,
    "status" enum('pending', 'used', 'expired') DEFAULT 'pending',
    "expiresAt" timestamp NOT NULL,
    "usedAt" timestamp,
    "attemptCount" integer DEFAULT 0,
    "maxAttempts" integer DEFAULT 3,
    "createdAt" timestamp DEFAULT now(),
    "updatedAt" timestamp DEFAULT now()
);

-- Indexes for performance
CREATE INDEX "IDX_otps_email" ON "otps" ("email");
CREATE INDEX "IDX_otps_email_type_status" ON "otps" ("email", "type", "status");
```

## 🚀 Production Deployment

### SMTP Configuration
For production, configure a reliable SMTP provider:

**Gmail:**
```env
USE_TEST_SMTP=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
```

**SendGrid:**
```env
USE_TEST_SMTP=false
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Security Considerations
1. **Rate Limiting:** Implement additional rate limiting at the API gateway level
2. **Email Validation:** Consider additional email validation services
3. **Monitoring:** Monitor OTP usage patterns for abuse
4. **Backup Auth:** Consider backup authentication methods

## 🔧 Maintenance

### Automatic Cleanup
- Expired OTPs are automatically marked as expired
- Old OTPs (7+ days) are automatically deleted
- Cleanup runs periodically based on `OTP_CLEANUP_INTERVAL`

### Manual Cleanup
```typescript
// Get OTP statistics
const stats = await otpService.getOtpStats('user@example.com');

// Manual cleanup of all expired OTPs
const cleanedCount = await otpService.cleanupAllExpiredOTPs();
```

## 📈 Monitoring

### Key Metrics to Monitor
- OTP generation rate
- Verification success rate
- Failed verification attempts
- Email delivery success rate
- Average time between generation and verification

### Health Checks
The system includes health check endpoints:
- `GET /api/health` - Overall system health
- Database connectivity is automatically checked

## 🆘 Troubleshooting

### Common Issues

**OTP Not Received:**
1. Check server logs for email sending errors
2. Verify SMTP configuration
3. Check spam/junk folders
4. Ensure email address is valid

**OTP Verification Fails:**
1. Check if OTP has expired (10 minutes)
2. Verify correct email and code combination
3. Check if maximum attempts exceeded (3 attempts)
4. Ensure OTP hasn't been used already

**Database Connection Issues:**
1. Verify PostgreSQL is running
2. Check database credentials in environment variables
3. Ensure database exists and migrations have run

### Debug Mode
Enable debug logging in development:
```env
LOG_LEVEL=debug
DEBUG_ENABLED=true
```

## 🔗 Integration Examples

### Frontend Integration (React/Vue/Angular)
```javascript
// Step 1: Request OTP
const requestOTP = async (email) => {
  const response = await fetch('/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
};

// Step 2: Verify OTP
const verifyOTP = async (email, code) => {
  const response = await fetch('/auth/sign-in-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  const data = await response.json();
  
  if (data.success) {
    // Store JWT token
    localStorage.setItem('token', data.accessToken);
    // Redirect to dashboard
    window.location.href = '/dashboard';
  }
  
  return data;
};
```

### Mobile Integration
```swift
// iOS Swift example
func requestOTP(email: String) async {
    let url = URL(string: "https://api.fashionfy.com/auth/sign-in")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let body = ["email": email]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    // Handle response
}
```

## 📚 Additional Resources

- [NestJS Authentication Documentation](https://docs.nestjs.com/security/authentication)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Email Security Guidelines](https://owasp.org/www-project-cheat-sheets/cheatsheets/Email_Security_Cheat_Sheet.html)
- [OWASP Authentication Guidelines](https://owasp.org/www-project-cheat-sheets/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 🎉 Summary

The OTP authentication system provides a secure, user-friendly authentication method that:

✅ **Eliminates passwords** - No password storage or management  
✅ **Automatic user creation** - Seamless onboarding for new users  
✅ **Email verification** - Built-in email verification process  
✅ **Security focused** - Rate limiting, expiration, attempt limits  
✅ **Production ready** - Comprehensive error handling and monitoring  
✅ **Developer friendly** - Clear APIs and extensive documentation  

The system is now ready for production use with proper SMTP configuration!
