# Fashly API - Features Summary

Quick overview of all implemented features and capabilities.

## 🎯 Core Features

### 1. ComfyUI AI Integration 🤖

**Process glass images through AI-powered Stable Diffusion workflows**

- **Auto-processing**: Fetch glass from catalog, process through ComfyUI, save to history automatically
- **Direct image processing**: Upload any image for AI processing
- **Customizable prompts**: Control image generation with positive/negative prompts
- **Reproducible results**: Use seed values for consistent outputs
- **History tracking**: All AI-generated results saved with metadata

**Key Endpoints:**
- `POST /api/comfyui/process-glass` - Process glass product image
- `POST /api/comfyui/image2image` - Process any base64 image
- `POST /api/comfyui/upload-process` - Upload and process file
- `GET /api/comfyui/health` - Check ComfyUI service status
- `GET /api/comfyui/queue` - Monitor processing queue

### 2. Glass Try-On History 👓

**Save and manage AI-generated glass try-on results**

- **Automatic saving**: Results saved with `savedTryOn: false` initially
- **User control**: Users can mark favorites with `savedTryOn: true`
- **Full metadata**: Stores prompts, seeds, processing time, image size
- **Filtering**: Filter by saved status
- **Pagination**: Efficient browsing of history
- **Rich data**: Includes full glass details in responses

**Key Endpoints:**
- `GET /api/glass-tryon-history` - Get user's try-on history
- `GET /api/glass-tryon-history/{id}` - Get specific record
- `PUT /api/glass-tryon-history/{id}/saved-status` - Mark as saved/unsaved
- `DELETE /api/glass-tryon-history/{id}` - Delete record

**Workflow:**
```
1. Call process-glass → Get history record with ID
2. User reviews result
3. If liked → Update savedTryOn to true
4. View saved results → Filter by savedTryOn=true
```

### 3. Glasses Catalog 🛍️

**Browse, search, and manage glasses products**

- **Public access**: No authentication required for browsing
- **Advanced search**: Search by name, brand, category
- **Filtering**: Filter by brand, category, price range, availability
- **Sorting**: Sort by name, brand, price, date
- **Pagination**: Efficient data loading
- **Favorites**: Users can mark glasses as favorites (requires auth)

**Key Endpoints:**
- `GET /api/glasses` - Browse all glasses with filters
- `GET /api/glasses/{id}` - Get specific glass details
- `GET /api/glasses/brands/available` - List all brands
- `GET /api/glasses/categories/available` - List all categories
- `GET /api/glasses/brand/{name}` - Filter by brand
- `GET /api/glasses/category/{name}` - Filter by category
- `POST /api/glasses/{id}/favorite` - Toggle favorite (requires auth)
- `GET /api/glasses/favorites/me` - Get user's favorites (requires auth)

**Search Examples:**
```bash
# Search by keyword
GET /api/glasses?search=Jeff

# Filter by brand
GET /api/glasses?brand=Gentle%20Monster

# Price range
GET /api/glasses?minPrice=100&maxPrice=500

# Sort by name
GET /api/glasses?sortBy=name&sortOrder=ASC

# Combine filters
GET /api/glasses?brand=Gentle%20Monster&category=Sunglasses&sortBy=price
```

### 4. User Authentication 🔐

**Secure JWT-based authentication system**

- **User registration**: Email + password signup
- **Login**: JWT token-based authentication
- **Profile management**: View and update user profile
- **Password security**: Bcrypt hashing with salt rounds
- **Token expiration**: Configurable JWT expiration
- **Public routes**: Flexible authentication with `@Public()` decorator

**Key Endpoints:**
- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login and get JWT token
- `GET /auth/profile` - Get current user profile (requires auth)

### 5. Virtual Try-On Tracking 📊

**Track and manage virtual try-on attempts**

- **Simple tracking**: Record when users try on glasses
- **History**: View past try-on attempts
- **Metadata**: Store additional information with each try-on
- **User-specific**: Each user's try-ons are private

**Key Endpoints:**
- `POST /api/tryon/save` - Save try-on record
- `GET /api/tryon/history` - Get try-on history
- `DELETE /api/tryon/history/{id}` - Delete record

### 6. AWS S3 Storage ☁️

**Secure file upload and download with presigned URLs**

- **Direct upload**: Upload files directly to S3 from client
- **Presigned URLs**: Time-limited secure URLs
- **Folder organization**: Organize files in folders
- **Size validation**: Validate file sizes before upload
- **Type validation**: Ensure correct MIME types

**Key Endpoints:**
- `POST /api/s3/presigned-upload-url` - Generate upload URL
- `POST /api/s3/presigned-download-url` - Generate download URL

## 🔄 Complete Workflows

### Workflow 1: Browse and Try On Glasses

```bash
# 1. Browse glasses catalog (no auth required)
GET /api/glasses?search=sunglasses

# 2. Get specific glass details
GET /api/glasses/{glassId}

# 3. Sign up or login
POST /auth/signup
# or
POST /auth/signin

# 4. Process glass through AI
POST /api/comfyui/process-glass
{
  "glassId": "{glassId}",
  "prompt": "person wearing stylish eyeglasses",
  "seed": 42
}
# Response includes history ID and savedTryOn: false

# 5. If user likes it, mark as saved
PUT /api/glass-tryon-history/{historyId}/saved-status
{
  "savedTryOn": true
}

# 6. View all saved try-ons
GET /api/glass-tryon-history?savedTryOn=true
```

### Workflow 2: Manage Favorites

```bash
# 1. Login
POST /auth/signin

# 2. Browse glasses
GET /api/glasses

# 3. Add to favorites
POST /api/glasses/{glassId}/favorite

# 4. View favorites
GET /api/glasses/favorites/me

# 5. Remove from favorites (toggle again)
POST /api/glasses/{glassId}/favorite
```

### Workflow 3: Upload and Process Custom Image

```bash
# 1. Upload image file
POST /api/comfyui/upload-process
Content-Type: multipart/form-data
- file: image.jpg
- prompt: "high quality photograph"
- seed: 42

# Response includes processed image as base64
```

## 📊 Database Schema

```
users
├── id (UUID, PK)
├── email (VARCHAR, unique)
├── password (VARCHAR, hashed)
├── firstName, lastName
└── timestamps

glasses
├── id (UUID, PK)
├── name, brand, category
├── price, availability
├── imageUrl (main image)
├── allImages (JSON array)
└── timestamps

glass_tryon_history
├── id (UUID, PK)
├── userId (FK → users)
├── glassesId (FK → glasses)
├── prompt, negativePrompt, seed
├── resultImageUrl (base64)
├── promptId (ComfyUI ID)
├── processingTime, imageSize
├── savedTryOn (boolean)
└── timestamps

favorites
├── id (UUID, PK)
├── userId (FK → users)
├── glassesId (FK → glasses)
└── timestamps
└── UNIQUE(userId, glassesId)

tryons
├── id (UUID, PK)
├── userId (FK → users)
├── glassesId (FK → glasses)
├── resultImageUrl
├── metadata (JSON)
└── timestamps
```

## 🔧 Configuration

### Required Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=fashly

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# ComfyUI
COMFYUI_API_URL=http://localhost:8188
COMFYUI_TIMEOUT=60000

# AWS S3 (optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket

# Application
NODE_ENV=development
PORT=3001
```

## 🎨 Key Design Decisions

### 1. Public Glass Catalog
- **Why**: Allow users to browse without creating an account
- **Implementation**: `@Public()` decorator on GET endpoints
- **Benefit**: Lower barrier to entry, better SEO

### 2. Two-Step Save Process
- **Why**: Automatically save all try-ons, let users mark favorites
- **Implementation**: `savedTryOn: false` by default
- **Benefit**: No data loss, user has full history

### 3. Base64 Image Storage
- **Why**: Simple integration, no separate file storage needed initially
- **Implementation**: Store images as base64 in database
- **Trade-off**: Database size vs. simplicity (can migrate to S3 later)

### 4. Automatic History Saving
- **Why**: Capture every AI generation automatically
- **Implementation**: `process-glass` endpoint saves to history
- **Benefit**: Complete audit trail, user can review later

### 5. JWT Authentication
- **Why**: Stateless, scalable authentication
- **Implementation**: JWT tokens with Passport.js
- **Benefit**: Easy to scale horizontally

## 📈 Performance Considerations

### ComfyUI Processing
- **Time**: 20-60 seconds per image
- **Solution**: Asynchronous processing, queue monitoring
- **Optimization**: Consider batch processing for multiple images

### Database Queries
- **Indexes**: Added on userId, glassesId, savedTryOn
- **Pagination**: Limit results to 20-50 per page
- **Optimization**: Consider caching for frequently accessed data

### Image Storage
- **Current**: Base64 in PostgreSQL
- **Consideration**: Migrate to S3 for better performance at scale
- **Trade-off**: Simplicity now vs. performance later

## 🚀 Quick Start Commands

```bash
# Development
pnpm install
pnpm run start:dev

# Build
pnpm run build

# Migrations
pnpm run migration:generate src/database/migrations/MigrationName
pnpm run migration:run

# Docker
docker-compose up -d

# Test API
curl http://localhost:3001/api/docs
```

## 📚 Documentation

- **[README.md](./README.md)** - Main project overview
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API documentation
- **[COMFYUI_INTEGRATION_GUIDE.md](./COMFYUI_INTEGRATION_GUIDE.md)** - ComfyUI setup
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment
- **Swagger**: `http://localhost:3001/api/docs` - Interactive API docs

## 🎯 Next Steps

### Immediate Improvements
1. Add image compression before saving
2. Implement caching for glass catalog
3. Add rate limiting on ComfyUI endpoints
4. Set up Redis for session management
5. Add email notifications for completed processing

### Future Features
1. User reviews and ratings
2. Product recommendations (ML-based)
3. Shopping cart and checkout
4. Order management
5. Admin dashboard
6. Real-time notifications
7. Social sharing
8. AR try-on (mobile)

## 💡 Tips

- **Testing**: Use Swagger UI for interactive testing
- **Debugging**: Check logs with `docker-compose logs -f app`
- **Performance**: Monitor ComfyUI queue to avoid overload
- **Security**: Rotate JWT_SECRET in production
- **Scaling**: Consider Redis for caching at scale
- **Images**: Compress images before uploading to ComfyUI

---

For detailed API documentation, see [API_REFERENCE.md](./API_REFERENCE.md)

