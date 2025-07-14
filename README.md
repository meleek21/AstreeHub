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
- User status management:
  - `Active`: User is active and can access the system
  - `Inactive`: User account is temporarily disabled
  - `Suspended`: User account is suspended due to policy violations
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
   The API will be available at `https://localhost:7000` and `http://localhost:5000` (ports may vary based on your launchSettings.json configuration)

### Frontend Setup

1. Navigate to the Client directory:
   ```
   cd Client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. The frontend will be available at `http://localhost:5173`

## Frontend Features

### Authentication

The frontend implements a complete authentication flow with:

- Login page with validation
- Password reset functionality
- Forced password change on first login
- Protected routes using React Router
- JWT token management with automatic refresh

### Dashboard

The main dashboard provides:

- Activity feed showing recent posts and events
- Quick access to departments and channels
- Notification center
- User online status indicators
- Weather widget (using OpenWeatherMap API)

### Messaging System

The real-time messaging features include:

- Private conversations between users
- Group conversations in channels
- File attachments (images, documents)
- Read receipts
- Online status indicators
- Typing indicators

### Calendar and Events

The calendar system provides:

- Month, week, and day views
- Event creation and management
- Event categories and types
- Event attendance management
- Google Calendar integration
- Event notifications and reminders

### Todo Management

The todo system allows users to:

- Create personal todo lists
- Assign tasks to other users
- Set due dates and priorities
- Track completion status
- Receive notifications for upcoming deadlines

### Department Management

Administrators can:

- Create and manage departments
- Assign directors to departments
- Manage department members
- Create department-specific channels

### User Management

Administrators can:

- Create new user accounts
- Manage user roles and permissions
- Activate/deactivate user accounts
- Reset user passwords
- View user activity logs

### Responsive Design

The application is fully responsive and works on:

- Desktop browsers
- Tablets
- Mobile devices

### API documentation
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

## Security Considerations

1. **API Keys Protection**: Never commit actual API keys to source control. Use environment variables or a secure secrets management system in production.

2. **Password Security**: The application enforces password complexity requirements (uppercase, lowercase, numbers, special characters).

3. **JWT Token Security**: Tokens have a 24-hour expiration time and are signed with a secure secret key.

4. **Email Security**: Password reset links expire after 15 minutes and are validated against the requesting email.

## Development vs. Production

### Email Service
- In development (empty API key): Emails are logged to the console instead of being sent
- In production (valid API key): Actual emails are sent via SendGrid

## Usage Guide

### User Registration

Only administrators (users with `SUPERADMIN` role) can register new users. If you're setting up the application for the first time, you'll need to create an initial admin user directly in the database or use a seed method.

### Navigating the Interface

1. **Dashboard**: The main landing page after login shows recent activities, notifications, and quick access to features.

2. **Messaging**: Access private and group conversations through the messaging icon in the navigation bar.

3. **Channels**: Department and team channels are accessible from the channels section.

4. **Events**: View and manage events from the calendar view.

5. **Todo Lists**: Create and manage tasks from the todo section.

### Creating Content

1. **Posts**: Create posts by clicking the "Create Post" button on the dashboard or channel page.

2. **Events**: Add events by clicking the "Add Event" button in the calendar view.

3. **Channels**: Administrators and department directors can create channels for their departments.

### Managing Departments

Only users with `SUPERADMIN` or `DIRECTOR` roles can manage departments:

1. Create departments from the admin panel
2. Assign employees to departments
3. Create department-specific channels

## Troubleshooting

### Common Issues

1. **Connection Issues**:
   - Ensure MongoDB and SQL Server are running
   - Check connection strings in your `.env` file
   - Verify CORS settings if frontend can't connect to backend

2. **Authentication Problems**:
   - JWT token issues: Check that your JWT secret is properly set
   - Login failures: Verify user credentials and account status
   - Password reset not working: Ensure SendGrid is properly configured

3. **Missing Environment Variables**:
   - If you see errors about missing configuration, check your `.env` file
   - Look for console warnings about environment variables not being found

4. **Database Migration Errors**:
   - Run `dotnet ef migrations script` to view the SQL that would be applied
   - Check for any pending migrations with `dotnet ef migrations list`

5. **SignalR Connection Issues**:
   - Ensure the SignalR client URL matches the server URL
   - Check browser console for CORS errors

### Logs

Check the following locations for logs:

- Backend logs: Console output when running the application
- Frontend logs: Browser developer console

## Contributing

1. Create a feature branch from the main branch
2. Implement your changes
3. Write tests for your changes if applicable
4. Ensure all tests pass
5. Submit a pull request with a detailed description of your changes

## License

MIT License

Copyright (c) 2023 ASTREE_PFE

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
