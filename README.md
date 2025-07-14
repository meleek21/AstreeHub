# AstreeHub - Enterprise Social Network Application

## Overview

ASTREE_PFE is a comprehensive enterprise social network application designed to enhance internal communication, collaboration, and productivity within organizations. The platform combines social networking features with productivity tools to create a unified workspace for employees.

## Features

### Authentication & User Management
- Secure JWT-based authentication system
- Role-based access control with three roles:
  - `EMPLOYEE`: Regular user with standard access
  - `DIRECTOR`: Department manager with additional privileges
  - `SUPERADMIN`: Administrator with full system access
- Password reset functionality with secure email verification
- First login detection with forced password change
- User profile management with Cloudinary-hosted profile pictures
- Real-time online status tracking

### Communication
- Real-time messaging with SignalR integration
- Private conversations and group chats
- Department and team channels
- Post creation and sharing
- Comments and reactions (Like, Love, Brilliant, Bravo, Youpi)
- Notifications system

### Productivity Tools
- Todo management with status tracking
- Event management with various types:
  - `Général`, `Réunion`, `Formation`, `ÉvénementEntreprise`, `Anniversaire`, `Personnel`, `Technique`
- Event categories including `RéunionÉquipe`, `Atelier`, `Conférence`, and more
- Event status tracking: `ÀVenir`, `Planifié`, `EnCours`, `Terminé`, `Annulé`
- Attendance management with status: `EnAttente`, `Accepté`, `Refusé`
- Google Calendar synchronization
- Weather information integration
- File sharing and document management

### Department Management
- Department creation and management
- Employee assignment to departments
- Department-specific channels

## Technology Stack

### Backend
- **Framework**: ASP.NET Core 8.0
- **Authentication**: JWT, ASP.NET Core Identity
- **Databases**:
  - SQL Server (via Entity Framework Core) for user and department data
  - MongoDB for social content (posts, messages, etc.)
- **Real-time Communication**: SignalR
- **File Storage**: Cloudinary
- **Email Service**: SendGrid
- **External APIs**: Google Calendar, OpenWeatherMap, Giphy

### Frontend
- **Framework**: React 18 with Vite
- **UI Libraries**: PrimeReact, React Bootstrap, Material UI
- **State Management**: React Query (@tanstack/react-query)
- **Real-time Communication**: SignalR (@microsoft/signalr)
- **Routing**: React Router v7
- **Calendar**: FullCalendar
- **Drag and Drop**: @hello-pangea/dnd
- **Icons**: FontAwesome, React Icons
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Animations**: Framer Motion

## Project Structure

```
ASTREE_PFE/
├── Client/                 # React frontend application
├── Configurations/         # Application configuration classes
├── Controllers/            # API controllers
├── DTOs/                   # Data Transfer Objects
├── Data/                   # Database context and configuration
├── Hubs/                   # SignalR hubs for real-time communication
├── Mappings/               # AutoMapper profiles
├── Migrations/             # EF Core database migrations
├── Models/                 # Domain models
├── Repositories/           # Data access layer
│   └── Interfaces/         # Repository interfaces
├── Services/               # Business logic layer
│   └── Interfaces/         # Service interfaces
├── appsettings.json        # Application settings
└── Program.cs             # Application entry point and configuration
```

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- Node.js and npm
- SQL Server (for Identity and relational data)
- MongoDB (for social content and messaging)
- Cloudinary account (for file storage)
- SendGrid account (for email services)
- Google API credentials (for calendar integration)
- Git

### Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ASTREE_PFE
   ```

2. Create a `.env` file in the root directory with the required environment variables. You can use the provided `.env.example` file as a template:
   ```bash
   # Copy the example file and edit it with your values
   cp .env.example .env
   # Edit the .env file with your preferred text editor
   ```

   The application uses a custom environment variable loading mechanism that supports:
   - Loading variables from a `.env` file
   - Replacing placeholders in `appsettings.json` with environment variables
   - Placeholders use the format `#{VARIABLE_NAME}#`

### Backend Setup

1. Restore .NET packages:
   ```bash
   dotnet restore
   ```

2. Set up the databases:

   a. SQL Server setup:
   ```bash
   # Make sure you have the EF Core CLI tools installed
   dotnet tool install --global dotnet-ef
   
   # Apply migrations to create the database schema
   dotnet ef database update
   ```
   
   This will create the SQL Server database schema based on the Entity Framework Core migrations in the project.

   b. MongoDB setup:
   - Make sure MongoDB is running on your system
   - The application will automatically create the required collections in MongoDB when they are first accessed
   - No manual setup is required for MongoDB beyond providing the connection string in your `.env` file

3. Run the backend:
   ```bash
   dotnet run
   ```
   The API will be available at `http://localhost:5126` (ports may vary based on your launchSettings.json configuration)

### Frontend Setup

1. Navigate to the Client directory:
   ```bash
   cd Client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`

## API Documentation

API documentation is available through Swagger UI when running the application in development mode. Access it at:

```
https://localhost:5126/swagger
```

## CORS Configuration

The API is configured to allow requests from the following origins:
- `http://localhost:5173` (default Vite development server)

If you need to allow requests from other origins, you'll need to modify the CORS configuration in `Program.cs`.

## Real-time Communication

The application uses SignalR for real-time communication. The following hubs are available:

- `/hubs/message` - For real-time messaging
- `/hubs/user` - For user status updates
- `/notificationHub` - For real-time notifications

To connect to these hubs from the frontend, use the SignalR client library.

## Authentication

### Login

```
POST /api/auth/login
```
Request body:
```json
{
  "email": "user@example.com",
  "password": "YourPassword123!"
}
```

### Password Reset

1. Request a password reset:
   ```
   POST /api/auth/request-password-reset
   ```
   Request body:
   ```json
   {
     "email": "user@example.com"
   }
   ```

2. Reset password with token:
   ```
   POST /api/auth/reset-password
   ```
   Request body:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "email": "user@example.com",
     "newPassword": "NewSecurePassword123!"
   }
   ```

## Security Considerations

1. **API Keys Protection**: Never commit actual API keys to source control. Use environment variables or a secure secrets management system in production.

2. **Password Security**: The application enforces password complexity requirements (uppercase, lowercase, numbers, special characters).

3. **JWT Token Security**: Tokens have a 24-hour expiration time and are signed with a secure secret key.

4. **Email Security**: Password reset links expire after 15 minutes and are validated against the requesting email.

## Development vs. Production

### Email Service
- In development (empty API key): Emails are logged to the console instead of being sent
- In production (valid API key): Actual emails are sent via SendGrid

## Contributing

1. Create a feature branch from the main branch
2. Implement your changes
3. Submit a pull request
