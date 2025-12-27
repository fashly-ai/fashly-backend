# Fashly Backend - Complete Fashion API

A comprehensive NestJS-based fashion API with AI-powered virtual try-on, glass catalog management, JWT authentication, and ComfyUI integration.

![API Demo](https://img.shields.io/badge/API-Ready-green) ![NestJS](https://img.shields.io/badge/NestJS-Framework-red) ![Auth](https://img.shields.io/badge/JWT-Authentication-blue) ![Docker](https://img.shields.io/badge/Docker-Ready-2496ED) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791) ![ComfyUI](https://img.shields.io/badge/ComfyUI-AI%20Processing-purple)

## ✨ Features

- **🤖 ComfyUI Integration**: AI-powered image processing with image2image workflows
- **👓 Glass Try-On History**: Save and manage AI-generated glass try-on results
- **🛍️ Glasses Catalog**: Browse, search, and filter glasses with favorites
- **🔐 JWT Authentication**: Secure user registration and login system
- **🗄️ PostgreSQL Database**: Robust data storage with TypeORM
- **👤 User Management**: Complete user profile system with favorites
- **📁 AWS S3 Integration**: Presigned URL generation for secure file uploads
- **📊 Try-On History**: Track and manage virtual try-on attempts
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

### Interactive Documentation
Visit `http://localhost:3000/api/docs` (Docker) or `http://localhost:3001/api/docs` (local) for interactive Swagger documentation.

### Complete API Reference
See **[API_REFERENCE.md](./API_REFERENCE.md)** for comprehensive documentation of all endpoints including:
- **ComfyUI Integration**: AI-powered glass image processing
- **Glass Try-On History**: Save and manage try-on results
- **Glasses Catalog**: Browse, search, and filter glasses
- **Virtual Try-On**: Track try-on attempts
- **AWS S3 Storage**: File upload/download
- **Authentication**: User registration and login

### Additional Guides
- **[COMFYUI_INTEGRATION_GUIDE.md](./COMFYUI_INTEGRATION_GUIDE.md)**: ComfyUI setup and integration
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**: Production deployment
- **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)**: Docker setup and configuration

## 🔐 API Usage Examples

### Quick Start Examples

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

### 7. ComfyUI Glass Try-On (NEW)

```bash
# Process a glass through ComfyUI AI
curl -X POST http://localhost:3000/api/comfyui/process-glass \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
    "prompt": "person wearing stylish eyeglasses, professional portrait, clear face, natural lighting",
    "negativePrompt": "blurry, low quality, distorted, cropped face",
    "seed": 42
  }'
```

**Response includes history ID for saving:**
```json
{
  "id": "c1e5d890-1234-5678-90ab-123456789abc",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
  "resultImageUrl": "data:image/png;base64,iVBORw0KGgo...",
  "savedTryOn": false,
  "processingTime": 30291,
  "imageSize": 224704
}
```

### 8. Save Try-On Result (NEW)

```bash
# Mark a try-on as saved (after user likes it)
curl -X PUT http://localhost:3000/api/glass-tryon-history/c1e5d890-1234-5678-90ab-123456789abc/saved-status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"savedTryOn": true}'
```

### 9. Browse Glasses Catalog (Public)

```bash
# No authentication required!
curl -X GET http://localhost:3000/api/glasses?search=Jeff&brand=Gentle%20Monster

# Get specific glass details
curl -X GET http://localhost:3000/api/glasses/42a793e7-54d6-4550-8020-33695a15fb91
```

### 10. Get Try-On History (NEW)

```bash
# Get all try-on history
curl -X GET http://localhost:3000/api/glass-tryon-history \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get only saved try-ons
curl -X GET http://localhost:3000/api/glass-tryon-history?savedTryOn=true \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🏗️ Architecture

### Technology Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 15 with TypeORM
- **AI Processing**: ComfyUI (Stable Diffusion image2image)
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

-- Glasses catalog
glasses {
  id: UUID (PK)
  name: VARCHAR
  productUrl: VARCHAR
  imageUrl: VARCHAR
  allImages: TEXT (JSON array)
  brand: VARCHAR
  category: VARCHAR
  price: VARCHAR
  availability: VARCHAR
  isActive: BOOLEAN
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}

-- Glass try-on history (ComfyUI results)
glass_tryon_history {
  id: UUID (PK)
  userId: UUID (FK -> users)
  glassesId: UUID (FK -> glasses)
  prompt: TEXT
  negativePrompt: TEXT
  seed: INTEGER
  resultImageUrl: TEXT (base64 or S3 URL)
  promptId: VARCHAR (ComfyUI prompt ID)
  filename: VARCHAR
  processingTime: INTEGER (milliseconds)
  imageSize: INTEGER (bytes)
  savedTryOn: BOOLEAN (default: false)
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}

-- User favorites
favorites {
  id: UUID (PK)
  userId: UUID (FK -> users)
  glassesId: UUID (FK -> glasses)
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
  UNIQUE(userId, glassesId)
}

-- Virtual try-on tracking
tryons {
  id: UUID (PK)
  userId: UUID (FK -> users)
  glassesId: UUID (FK -> glasses)
  resultImageUrl: VARCHAR
  metadata: TEXT (JSON)
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
│   ├── profile.controller.ts     # User profile management
│   ├── strategies/
│   │   └── jwt.strategy.ts       # JWT validation strategy
│   ├── guards/
│   │   └── jwt-auth.guard.ts     # JWT authentication guard
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # Get current user
│   │   └── public.decorator.ts        # Mark routes as public
│   ├── services/
│   │   ├── email.service.ts      # Email sending (SMTP)
│   │   └── otp.service.ts        # OTP generation/validation
│   └── dto/
│       ├── signup.dto.ts         # User registration DTO
│       ├── signin.dto.ts         # User login DTO
│       ├── email-signin.dto.ts   # Email-based signin
│       └── verify-otp.dto.ts     # OTP verification
├── comfyui/                      # ComfyUI AI integration ⭐ NEW
│   ├── comfyui.controller.ts     # ComfyUI endpoints
│   ├── comfyui.service.ts        # ComfyUI workflow processing
│   ├── comfyui.module.ts         # ComfyUI module configuration
│   ├── glass-tryon-history.controller.ts  # Try-on history endpoints
│   ├── glass-tryon-history.service.ts     # History management
│   └── dto/
│       ├── image2image.dto.ts    # Image processing DTOs
│       ├── process-glass.dto.ts  # Glass processing DTO
│       └── glass-tryon-history.dto.ts  # History DTOs
├── glasses/                      # Glasses catalog ⭐ NEW
│   ├── glasses.controller.ts     # Glasses CRUD & search
│   ├── glasses.service.ts        # Business logic
│   ├── glasses.module.ts         # Module configuration
│   └── dto/
│       ├── glasses-query.dto.ts  # Search/filter params
│       ├── glasses-response.dto.ts  # Response format
│       └── favorite.dto.ts       # Favorites management
├── virtual-tryon/                # Virtual try-on tracking
│   ├── virtual-tryon.controller.ts  # Try-on endpoints
│   ├── virtual-tryon.service.ts     # Try-on logic
│   ├── virtual-tryon.module.ts      # Module configuration
│   └── dto/
│       └── tryon-history.dto.ts  # Try-on DTOs
├── s3/                           # AWS S3 integration
│   ├── s3.controller.ts          # S3 presigned URL endpoints
│   ├── s3.service.ts             # S3 operations & validation
│   ├── s3.module.ts              # S3 module configuration
│   └── dto/
│       ├── generate-presigned-url.dto.ts    # Upload URL DTO
│       └── generate-download-url.dto.ts     # Download URL DTO
├── crawling/                     # Web scraping
│   ├── crawling.controller.ts    # Crawling endpoints
│   ├── crawling.service.ts       # Scraping logic
│   ├── crawling.module.ts        # Module configuration
│   └── dto/
│       └── crawl.dto.ts          # Crawling DTOs
└── database/                     # Database configuration
    ├── database.module.ts        # TypeORM configuration
    ├── data-source.ts            # Database connection
    ├── entities/
    │   ├── user.entity.ts        # User entity
    │   ├── glasses.entity.ts     # Glasses catalog
    │   ├── glass-tryon-history.entity.ts  # Try-on history
    │   ├── favorite.entity.ts    # User favorites
    │   ├── tryon.entity.ts       # Virtual try-on
    │   └── otp.entity.ts         # OTP codes
    └── migrations/               # Database migrations
        └── *.ts                  # Migration files
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

# ComfyUI Configuration
COMFYUI_API_URL=http://localhost:8188
COMFYUI_TIMEOUT=60000

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

# ComfyUI Configuration (Docker service name)
COMFYUI_API_URL=http://comfyui:8188
COMFYUI_TIMEOUT=60000

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
| GET | `/api/glasses` | Browse glasses catalog with filters |
| GET | `/api/glasses/{id}` | Get glass details by ID |
| GET | `/api/glasses/brands/available` | Get all available brands |
| GET | `/api/glasses/categories/available` | Get all available categories |
| GET | `/api/glasses/brand/{name}` | Get glasses by brand |
| GET | `/api/glasses/category/{name}` | Get glasses by category |
| POST | `/api/comfyui/image2image` | Process image through ComfyUI |
| POST | `/api/comfyui/upload-process` | Upload and process image |
| GET | `/api/comfyui/health` | Check ComfyUI service health |
| GET | `/api/comfyui/queue` | Get ComfyUI queue status |

### Protected Endpoints (Require JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/profile` | Get user profile |
| **ComfyUI & Glass Try-On** | | |
| POST | `/api/comfyui/process-glass` | Process glass through ComfyUI + save history |
| GET | `/api/glass-tryon-history` | Get user's glass try-on history |
| GET | `/api/glass-tryon-history/{id}` | Get specific try-on record |
| PUT | `/api/glass-tryon-history/{id}/saved-status` | Update saved status |
| DELETE | `/api/glass-tryon-history/{id}` | Delete try-on record |
| POST | `/api/glass-tryon-history` | Manually save try-on result |
| **Glasses & Favorites** | | |
| POST | `/api/glasses/{id}/favorite` | Toggle favorite status |
| GET | `/api/glasses/favorites/me` | Get user's favorite glasses |
| **Virtual Try-On** | | |
| POST | `/api/tryon/save` | Save virtual try-on record |
| GET | `/api/tryon/history` | Get try-on history |
| DELETE | `/api/tryon/history/{id}` | Delete try-on record |
| **AWS S3 Storage** | | |
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

5. **ComfyUI Connection Issues**
   - Ensure ComfyUI is running on the configured URL
   - Check `COMFYUI_API_URL` in `.env` file
   - For Docker: ensure ComfyUI service is accessible
   - Test with: `curl http://localhost:8188/system_stats`
   - Check ComfyUI logs for errors

6. **Glass Processing Issues**
   - Verify glass has `_D_45.jpg` image in `allImages`
   - Ensure image URLs are accessible
   - Processing can take 20-60 seconds - be patient
   - Check ComfyUI queue status: `GET /api/comfyui/queue`

### Performance Tips

- For production: use dedicated PostgreSQL instance
- Configure proper JWT expiration times
- Implement rate limiting for auth endpoints
- Use connection pooling for database
- Enable logging for monitoring
- **ComfyUI**: Consider GPU acceleration for faster processing
- **Images**: Cache processed results to avoid reprocessing
- **Database**: Add indexes for frequently queried fields

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

This API has been extended with comprehensive features for fashion e-commerce:

### ✅ Implemented Features

1. **✅ ComfyUI AI Integration**: Process images through Stable Diffusion workflows
2. **✅ Glass Try-On History**: Save and manage AI-generated try-on results
3. **✅ Glasses Catalog**: Full CRUD with search, filters, and pagination
4. **✅ User Favorites**: Save favorite glasses for quick access
5. **✅ Virtual Try-On Tracking**: Track user try-on attempts
6. **✅ Public API Access**: Browse glasses without authentication
7. **✅ AWS S3 Integration**: Secure file uploads with presigned URLs
8. **✅ Database Migrations**: Automated schema management

### 🔮 Potential Extensions

You can further extend the API with:

1. **User Reviews & Ratings**: Add reviews for glasses products
2. **Recommendation Engine**: ML-based product recommendations
3. **Shopping Cart & Checkout**: E-commerce functionality
4. **Order Management**: Track purchases and shipments
5. **Role-based Access Control**: Admin, seller, buyer roles
6. **Email Verification**: Registration confirmation
7. **OAuth Integration**: Google, GitHub, Facebook login
8. **API Rate Limiting**: Protect against abuse
9. **Audit Logging**: Track user actions
10. **Password Reset**: Forgot password functionality
11. **Push Notifications**: Real-time updates
12. **Analytics Dashboard**: Track usage metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Resources

### Internal Documentation
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API endpoint documentation
- **[COMFYUI_INTEGRATION_GUIDE.md](./COMFYUI_INTEGRATION_GUIDE.md)** - ComfyUI setup guide
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment guide
- **[DOCKER_GUIDE.md](./DOCKER_GUIDE.md)** - Docker setup and usage

### External Resources
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [ComfyUI GitHub](https://github.com/comfyanonymous/ComfyUI)
- [Stable Diffusion](https://stability.ai/)
- [JWT.io](https://jwt.io/) - JSON Web Token debugger
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 💬 Support

For questions or issues:
- Create an issue in this repository
- Check the troubleshooting section above
- Review the Swagger documentation at `/api/docs`