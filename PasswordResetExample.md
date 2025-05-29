# Password Reset API Usage Examples

This document demonstrates how to use the new password reset endpoints.

## 1. Request Password Reset

**Endpoint:** `POST /api/auth/request-password-reset`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Always 200 OK):**
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Security Note:** The endpoint always returns success to prevent email enumeration attacks.

## 2. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "user@example.com",
  "newPassword": "NewSecurePassword123!"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Password has been reset successfully."
}
```

**Error Response (400 Bad Request):**
```json
{
  "message": "Invalid or expired reset token."
}
```

## Security Features

1. **JWT Token Security:**
   - 15-minute expiration time
   - Signed with the same secret key as regular JWT tokens
   - Contains purpose claim to prevent token reuse
   - Email validation ensures token matches request

2. **Email Enumeration Protection:**
   - Request endpoint always returns 200 OK
   - No indication whether user exists or not

3. **Token Validation:**
   - Validates signature, expiration, and purpose
   - Ensures email in token matches request email
   - Uses secure password reset through UserManager

## Reset Link Format

The reset link sent via email follows this format:
```
http://localhost/reset-password?token={JWT_TOKEN}&email={USER_EMAIL}
```

## Implementation Notes

- Uses ASP.NET Core Identity's `UserManager.ResetPasswordAsync()` for secure password updates
- Email service is currently a placeholder - integrate with actual email provider in production
- JWT tokens use the same signing key as regular authentication tokens
- All password validation rules from Identity configuration apply