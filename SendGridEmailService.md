# SendGrid Email Service Integration

## Overview
This document explains how the SendGrid email service has been integrated into the ASTREE application for sending emails, particularly for password reset functionality.

## Configuration

### 1. SendGrid API Key
The SendGrid API key is configured in `appsettings.json`. For security reasons, the API key is left empty in the configuration file and should be populated in the production environment.

```json
"SendGrid": {
  "ApiKey": "",  // Add your SendGrid API key here
  "FromEmail": "noreply@astree.com",
  "FromName": "ASTREE"
}
```

### 2. How to Get a SendGrid API Key
1. Create a SendGrid account at [https://sendgrid.com/](https://sendgrid.com/)
2. Navigate to Settings > API Keys
3. Create a new API key with appropriate permissions (at minimum, "Mail Send" permissions)
4. Copy the generated API key and add it to your `appsettings.json` file

## Email Service Implementation

The email service has been implemented with two main methods:

### 1. SendEmailAsync
A general-purpose method for sending any type of email:

```csharp
Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent, string plainTextContent = null);
```

### 2. SendPasswordResetEmailAsync
A specialized method for sending password reset emails:

```csharp
Task SendPasswordResetEmailAsync(string email, string resetLink);
```

## Development vs. Production Behavior

The email service has been designed to work in both development and production environments:

- **Development (Empty API Key)**: When the SendGrid API key is empty, the service will log the email content instead of actually sending it. This allows for testing without requiring a valid API key.

- **Production (Valid API Key)**: When a valid API key is provided, the service will send actual emails using the SendGrid API.

## Usage Examples

### Sending a Password Reset Email

```csharp
await _emailService.SendPasswordResetEmailAsync(userEmail, resetLink);
```

### Sending a Custom Email

```csharp
string subject = "Welcome to ASTREE";
string htmlContent = "<h1>Welcome!</h1><p>Thank you for joining ASTREE.</p>";
string plainTextContent = "Welcome! Thank you for joining ASTREE.";

await _emailService.SendEmailAsync(userEmail, subject, htmlContent, plainTextContent);
```

## Error Handling

The `SendEmailAsync` method returns a boolean indicating whether the email was sent successfully. In case of failure, errors are logged with detailed information about what went wrong.

## Security Considerations

1. **API Key Protection**: Never commit the actual SendGrid API key to source control. Use environment variables or a secure secrets management system in production.

2. **Email Content**: Be cautious about including sensitive information in emails. Password reset links should expire quickly (the current implementation sets a 15-minute expiration).

3. **Rate Limiting**: Be aware that SendGrid has rate limits. For high-volume applications, consider implementing a queue system for email sending.