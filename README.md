# Fashly Backend - Authentication API

A robust NestJS-based authentication API with JWT tokens, PostgreSQL database, and Docker deployment ready.

![API Demo](https://img.shields.io/badge/API-Ready-green) ![NestJS](https://img.shields.io/badge/NestJS-Framework-red) ![Auth](https://img.shields.io/badge/JWT-Authentication-blue) ![Docker](https://img.shields.io/badge/Docker-Ready-2496ED) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791)

## ✨ Features

- **🔐 JWT Authentication**: Secure user registration and login system
- **🗄️ PostgreSQL Database**: Robust data storage with TypeORM
- **👤 User Management**: Complete user profile system
- **📁 AWS S3 Integration**: Presigned URL generation for secure file uploads
- **🛡️ Security**: Password hashing, input validation, CORS protection
- **🐳 Docker Ready**: Complete containerized deployment with docker-compose
- **📚 API Documentation**: Interactive Swagger/OpenAPI documentation
- **🔧 Configuration**: Environment-based configuration management
- **🏗️ Scalable Architecture**: Clean, modular NestJS structure

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd demo-integration
   ```

2. **Set up environment**:
   ```bash
   cp env.docker.example .env
   # Edit .env if needed (optional for basic setup)
   ```

3. **Start with Docker**:
   ```bash
   docker-compose up -d
   ```

4. **Access the API**:
   - **API**: `http://localhost:3000`
   - **Swagger Docs**: `http://localhost:3000/api/docs`
   - **pgAdmin**: `http://localhost:5050` (admin@example.com / admin)

### Option 2: Local Development

#### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 15+

#### Setup

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd demo-integration
   pnpm install
   ```

2. **Database setup**:
   ```bash
   # Create PostgreSQL database
   createdb auth_api
   ```

3. **Environment setup**:
   ```bash
   cp .env.example .env
   # Edit .env and configure database connection
   ```

4. **Start the server**:
   ```bash
   pnpm run start:dev
   ```

## 📚 API Documentation

Visit `http://localhost:3000/api/docs` (Docker) or `http://localhost:3001/api/docs` (local) for interactive Swagger documentation.

## 🔐 API Usage Examples

### 1. API Health Check

```bash
curl -X GET http://localhost:3000/
```

**Response:**
```json
{
  "message": "Authentication API is running!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/auth",
    "docs": "/api/docs"
  }
}
```

### 2. User Registration

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "securePassword123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe"
  }
}
```

### 3. User Login

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### 4. Get User Profile (Protected)

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 5. Generate S3 Presigned Upload URL (Protected)

```bash
curl -X POST http://localhost:3000/api/s3/presigned-upload-url \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "profile-picture.jpg",
    "fileType": "image/jpeg",
    "folder": "user-uploads",
    "expiresIn": 3600,
    "fileSize": 1048576
  }'
```

**Response:**
```json
{
  "uploadUrl": "https://your-bucket.s3.amazonaws.com/user-uploads/1704067200000_abc123_profile-picture.jpg?...",
  "downloadUrl": "https://your-bucket.s3.amazonaws.com/user-uploads/1704067200000_abc123_profile-picture.jpg?...",
  "key": "user-uploads/1704067200000_abc123_profile-picture.jpg",
  "bucket": "your-bucket",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "john@example.com"
  },
  "instructions": {
    "upload": "Use the uploadUrl with a PUT request to upload your file directly to S3",
    "download": "Use the downloadUrl to access the uploaded file (valid for 24 hours)",
    "contentType": "Make sure to set Content-Type header when uploading"
  }
}
```

### 6. Upload File to S3 (Using Presigned URL)

```bash
# Upload file using the presigned URL from step 5
curl -X PUT "https://your-bucket.s3.amazonaws.com/user-uploads/1704067200000_abc123_profile-picture.jpg?..." \
  -H "Content-Type: image/jpeg" \
  --data-binary @profile-picture.jpg
```

## 🏗️ Architecture

### Technology Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 15 with TypeORM
- **Authentication**: JWT with Passport.js
- **File Storage**: AWS S3 with presigned URLs
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Deployment**: Docker & Docker Compose

### Database Schema

```sql
-- Users table
users {
  id: UUID (PK)
  email: VARCHAR (unique)
  firstName: VARCHAR
  lastName: VARCHAR
  password: VARCHAR (hashed with bcrypt)
  isActive: BOOLEAN
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### Authentication Flow

```
1. User Registration/Login
   ↓
2. Password Validation & Hashing
   ↓
3. JWT Token Generation
   ↓
4. Token-based Access Control
   ↓
5. Protected Route Access
```

## 📁 Project Structure

```
src/
├── app.module.ts                 # Main application module
├── app.controller.ts             # Health check endpoint
├── app.service.ts                # Basic app services
├── main.ts                       # Application entry point
├── auth/                         # Authentication system
│   ├── auth.controller.ts        # Auth endpoints (signup/signin/profile)
│   ├── auth.service.ts           # Auth business logic & JWT
│   ├── auth.module.ts            # Auth module configuration
│   ├── strategies/
│   │   └── jwt.strategy.ts       # JWT validation strategy
│   ├── guards/
│   │   └── jwt-auth.guard.ts     # JWT authentication guard
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # Get current user
│   │   └── public.decorator.ts        # Mark routes as public
│   └── dto/
│       ├── signup.dto.ts         # User registration DTO
│       └── signin.dto.ts         # User login DTO
├── s3/                           # AWS S3 integration
│   ├── s3.controller.ts          # S3 presigned URL endpoints
│   ├── s3.service.ts             # S3 operations & validation
│   ├── s3.module.ts              # S3 module configuration
│   └── dto/
│       ├── generate-presigned-url.dto.ts    # Upload URL DTO
│       └── generate-download-url.dto.ts     # Download URL DTO
└── database/                     # Database configuration
    ├── database.module.ts        # TypeORM configuration
    └── entities/
        └── user.entity.ts        # User entity
```

## 🔧 Configuration

### Environment Variables

#### For Local Development (`.env`)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=auth_api

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-s3-bucket-name

# Application Configuration
NODE_ENV=development
PORT=3001
```

#### For Docker Deployment
```env
# Database Configuration (Docker internal networking)
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=auth_api

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h

# Application Configuration
NODE_ENV=production
PORT=3000
```

## 🐳 Docker Deployment

### Production Deployment

1. **Prepare environment**:
   ```bash
   cp env.docker.example .env
   # Edit .env with production values
   ```

2. **Build and start**:
   ```bash
   docker-compose up -d
   ```

3. **Access services**:
   - **API**: `http://localhost:3000`
   - **Database**: `localhost:5432`
   - **pgAdmin**: `http://localhost:5050`

### Development with Docker

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Start with pgAdmin for database management
docker-compose --profile admin up -d
```

### Docker Services

- **app**: NestJS application (port 3000)
- **db**: PostgreSQL database (port 5432)
- **pgadmin**: Database management UI (port 5050, optional)

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **Input Validation**: Comprehensive validation with class-validator
- **CORS Configuration**: Cross-origin request handling
- **Environment Protection**: Secure environment variable management
- **SQL Injection Protection**: TypeORM query protection
- **XSS Protection**: Input sanitization

## 🚀 Development

### Running in Development Mode
```bash
pnpm run start:dev
```

### Building for Production
```bash
pnpm run build
pnpm run start:prod
```

### Database Migrations

The application uses TypeORM migrations for database schema management.

#### Migration Commands

```bash
# Generate a new migration based on entity changes
pnpm run migration:generate src/database/migrations/MigrationName

# Create an empty migration file (for custom changes)
pnpm run migration:create src/database/migrations/MigrationName

# Run pending migrations
pnpm run migration:run

# Revert the last migration
pnpm run migration:revert

# Show migration status
pnpm run migration:show
```

#### Migration Workflow

1. **After modifying entities**, generate a migration:
   ```bash
   pnpm run migration:generate src/database/migrations/UpdateUserTable
   ```

2. **Review the generated migration** in `src/database/migrations/` to ensure it's correct

3. **Run the migration** to apply changes:
   ```bash
   pnpm run migration:run
   ```

#### Initial Setup (Already Done)

For reference, the initial database setup was done with:

```bash
# Create database (using existing PostgreSQL Docker)
PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE fashly;"

# Run initial migration
pnpm run migration:run
```

### Running Tests
```bash
pnpm run test
pnpm run test:e2e
pnpm run test:cov
```

## 📊 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/auth/signup` | User registration |
| POST | `/auth/signin` | User login |

### Protected Endpoints (Require JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/profile` | Get user profile |
| POST | `/api/s3/presigned-upload-url` | Generate S3 presigned upload URL |
| POST | `/api/s3/presigned-download-url` | Generate S3 presigned download URL |

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - For Docker: ensure `db` service is healthy

2. **Authentication Errors**
   - Ensure JWT_SECRET is set in environment
   - Check token expiration (default 24h)
   - Use proper Authorization header: `Bearer <token>`

3. **Docker Issues**
   - Ensure Docker and docker-compose are installed
   - Check port availability (3000, 5432, 5050)
   - Review container logs: `docker-compose logs`

4. **Build Errors**
   - Run `pnpm install` to ensure dependencies
   - Check TypeScript version compatibility
   - Verify all environment variables are set

### Performance Tips

- For production: use dedicated PostgreSQL instance
- Configure proper JWT expiration times
- Implement rate limiting for auth endpoints
- Use connection pooling for database
- Enable logging for monitoring

## 📊 Monitoring & Logs

### Application Logs
```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db
```

### Database Management
Access pgAdmin at `http://localhost:5050`:
- Email: admin@example.com
- Password: admin
- Server: db:5432

## 🔄 Extending the API

This authentication API provides a solid foundation for building larger applications. You can easily extend it by:

1. **Adding new modules**: Business logic, file uploads, notifications
2. **Implementing role-based access**: Admin, user, moderator roles
3. **Adding email verification**: Registration confirmation
4. **OAuth integration**: Google, GitHub, Facebook login
5. **API rate limiting**: Protect against abuse
6. **Audit logging**: Track user actions
7. **Password reset**: Forgot password functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [JWT.io](https://jwt.io/) - JSON Web Token debugger
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 💬 Support

For questions or issues:
- Create an issue in this repository
- Check the troubleshooting section above
- Review the Swagger documentation at `/api/docs`