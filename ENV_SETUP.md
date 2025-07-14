# Environment Variables Setup Guide

## Overview

This project has been configured to use environment variables for sensitive information such as API keys, database connection strings, and other secrets. This approach enhances security by keeping sensitive data out of the codebase and version control.

## Setup Instructions

### 1. Environment Variables File (.env)

The project uses a `.env` file to store environment variables. This file is excluded from version control via `.gitignore` to prevent accidental exposure of sensitive information.

- Ensure the `.env` file is present in the root directory of the project
- Never commit the `.env` file to version control
- When deploying to production, set up environment variables on your hosting platform instead of using a `.env` file

### 2. Required Environment Variables

The following environment variables are required for the application to function properly:

```
# Database Connection Strings
DEFAULT_CONNECTION="Your SQL Server Connection String"
MONGO_CONNECTION="Your MongoDB Connection String"
MONGO_DATABASE="Your MongoDB Database Name"

# Cloudinary Settings
CLOUDINARY_CLOUD_NAME="Your Cloudinary Cloud Name"
CLOUDINARY_API_KEY="Your Cloudinary API Key"
CLOUDINARY_API_SECRET="Your Cloudinary API Secret"

# JWT Settings
JWT_VALID_AUDIENCE="Your JWT Valid Audience"
JWT_VALID_ISSUER="Your JWT Valid Issuer"
JWT_SECRET="Your JWT Secret Key"

# Google Settings
GOOGLE_CLIENT_ID="Your Google Client ID"
GOOGLE_CLIENT_SECRET="Your Google Client Secret"
GOOGLE_REDIRECT_URI="Your Google Redirect URI"
GOOGLE_CREDENTIALS_PATH="Path to Google Credentials JSON file"

# Giphy Settings
GIPHY_API_KEY="Your Giphy API Key"

# OpenWeatherMap Settings
OPENWEATHERMAP_API_KEY="Your OpenWeatherMap API Key"

# SendGrid Settings
SENDGRID_API_KEY="Your SendGrid API Key"
SENDGRID_FROM_EMAIL="Your SendGrid From Email"
SENDGRID_FROM_NAME="Your SendGrid From Name"
```

### 3. How It Works

The application uses a custom `EnvLoader` class to load environment variables from the `.env` file and replace placeholders in the `appsettings.json` file with the actual values.

Placeholders in `appsettings.json` follow this format: `#{VARIABLE_NAME}#`

### 4. For New Developers

When a new developer joins the project:

1. They should create their own `.env` file based on the template above
2. They should obtain the actual values for each environment variable from a secure source (not via email or chat)
3. They should never commit their `.env` file to version control

### 5. Adding New Environment Variables

If you need to add new environment variables:

1. Add the variable to your `.env` file
2. Add a placeholder in `appsettings.json` using the format `#{VARIABLE_NAME}#`
3. Update this documentation to include the new variable
4. Inform other developers about the new variable

## Security Considerations

- Regularly rotate API keys and secrets
- Use different API keys for development and production environments
- Consider using a secrets management service for production environments
- Never log environment variables or secrets
- Ensure `.env` is in your `.gitignore` file

## Troubleshooting

If the application fails to start or throws configuration errors:

1. Ensure your `.env` file exists in the root directory
2. Verify that all required environment variables are defined in the `.env` file
3. Check for typos in variable names
4. Ensure the format of connection strings and other values is correct

## Additional Resources

- [ASP.NET Core Configuration Documentation](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)
- [Environment Variables in .NET](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/configuration/?view=aspnetcore-6.0#environment-variables)
- [Secrets Management in ASP.NET Core](https://docs.microsoft.com/en-us/aspnet/core/security/app-secrets)