# Fashly API Reference

Complete documentation for all API endpoints including ComfyUI integration, glasses management, try-on history, and more.

## 📚 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [ComfyUI Integration](#comfyui-integration)
4. [Glass Try-On History](#glass-try-on-history)
5. [Glasses Management](#glasses-management)
6. [Virtual Try-On History](#virtual-try-on-history)
7. [AWS S3 Storage](#aws-s3-storage)
8. [Error Handling](#error-handling)

---

## Overview

**Base URL (Local)**: `http://localhost:3001`  
**Base URL (Docker)**: `http://localhost:3000`  
**Swagger Documentation**: `http://localhost:3001/api/docs`

### Authentication Methods

Most endpoints require JWT authentication. Include the token in the `Authorization` header:

```bash
Authorization: Bearer <your-jwt-token>
```

Some endpoints are marked as **public** and don't require authentication.

---

## Authentication

### 1. Sign Up

Create a new user account.

**Endpoint**: `POST /auth/signup`  
**Authentication**: Public

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response** (201):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe"
  }
}
```

### 2. Sign In

Login with existing credentials.

**Endpoint**: `POST /auth/signin`  
**Authentication**: Public

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 3. Get Profile

Retrieve current user's profile.

**Endpoint**: `GET /auth/profile`  
**Authentication**: Required

**Response** (200):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## ComfyUI Integration

Process images using ComfyUI's image-to-image workflow for AI-powered glass visualization.

### 1. Process Glass Image

Automatically process a glass product image using ComfyUI and save to history.

**Endpoint**: `POST /api/comfyui/process-glass`  
**Authentication**: Required

**Request Body**:
```json
{
  "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
  "prompt": "person wearing stylish eyeglasses, professional portrait, clear face, natural lighting",
  "negativePrompt": "blurry, low quality, distorted, cropped face, partial face",
  "seed": 42
}
```

**Parameters**:
- `glassId` (required): UUID of the glass product from database
- `prompt` (optional): Positive prompt for image generation (default: "person wearing eyeglasses, professional photo, clear face")
- `negativePrompt` (optional): Negative prompt to avoid unwanted features (default: "blurry, low quality, distorted, cropped face")
- `seed` (optional): Random seed for reproducibility. Leave empty for random.

**How it works**:
1. Fetches the glass from database by `glassId`
2. Extracts the `_D_45.jpg` image from the glass's `allImages` array
3. Downloads the image from the URL
4. Processes it through ComfyUI using image2image workflow
5. Automatically saves to history with `savedTryOn: false`
6. Returns the full history record including the history `id`

**Response** (200):
```json
{
  "id": "c1e5d890-1234-5678-90ab-123456789abc",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
  "glasses": {
    "id": "42a793e7-54d6-4550-8020-33695a15fb91",
    "name": "Jeff BRC1",
    "brand": "Gentle Monster",
    "category": "Glasses",
    "price": "Sold out",
    "imageUrl": "https://...",
    "productUrl": "https://..."
  },
  "prompt": "person wearing stylish eyeglasses, professional portrait, clear face, natural lighting",
  "negativePrompt": "blurry, low quality, distorted, cropped face, partial face",
  "seed": 42,
  "resultImageUrl": "data:image/png;base64,iVBORw0KGgo...",
  "promptId": "2a24dfdd-ae76-4ce3-96f7-3b83795e2f53",
  "filename": "ComfyUI_00021_.png",
  "processingTime": 30291,
  "imageSize": 224704,
  "savedTryOn": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**cURL Example**:
```bash
curl -X POST 'http://localhost:3001/api/comfyui/process-glass' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
    "prompt": "person wearing stylish eyeglasses, professional portrait, clear face, natural lighting",
    "negativePrompt": "blurry, low quality, distorted, cropped face, partial face",
    "seed": 42
  }'
```

### 2. Image to Image (Direct)

Process any base64-encoded image through ComfyUI workflow.

**Endpoint**: `POST /api/comfyui/image2image`  
**Authentication**: Public

**Request Body**:
```json
{
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "prompt": "high quality photograph, professional, detailed",
  "negativePrompt": "blurry, low quality, distorted",
  "seed": 42,
  "denoise": 0.87
}
```

**Parameters**:
- `imageBase64` (required): Base64-encoded image data (without `data:image/...` prefix)
- `prompt` (optional): Positive prompt for generation
- `negativePrompt` (optional): Negative prompt
- `seed` (optional): Random seed
- `denoise` (optional): Denoising strength (0.0-1.0, default: 0.87)

**Response** (200):
```json
{
  "promptId": "7cb6261d-3b03-4171-bbd1-a4b256b42404",
  "filename": "ComfyUI_00001_.png",
  "imageBase64": "data:image/png;base64,iVBORw0KGgo...",
  "size": 1024567,
  "processingTime": 5432
}
```

### 3. Upload and Process

Upload an image file and process through ComfyUI.

**Endpoint**: `POST /api/comfyui/upload-process`  
**Authentication**: Public  
**Content-Type**: `multipart/form-data`

**Form Data**:
- `file` (required): Image file (PNG, JPEG, JPG)
- `prompt` (optional): Positive prompt
- `negativePrompt` (optional): Negative prompt
- `seed` (optional): Random seed
- `denoise` (optional): Denoising strength

**cURL Example**:
```bash
curl -X POST 'http://localhost:3001/api/comfyui/upload-process' \
  -F 'file=@/path/to/image.jpg' \
  -F 'prompt=high quality photograph' \
  -F 'negativePrompt=blurry, low quality' \
  -F 'seed=42'
```

**Response** (200):
```json
{
  "promptId": "7cb6261d-3b03-4171-bbd1-a4b256b42404",
  "filename": "ComfyUI_00001_.png",
  "imageBase64": "data:image/png;base64,iVBORw0KGgo...",
  "size": 1024567,
  "processingTime": 5432
}
```

### 4. ComfyUI Health Check

Check if ComfyUI service is running and responsive.

**Endpoint**: `GET /api/comfyui/health`  
**Authentication**: Public

**Response** (200):
```json
{
  "status": "healthy",
  "message": "ComfyUI is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "systemStats": {
    "uptime": 3600,
    "memoryUsage": "2.5 GB",
    "cpuUsage": "45%"
  }
}
```

### 5. Get Queue Status

Get ComfyUI processing queue information.

**Endpoint**: `GET /api/comfyui/queue`  
**Authentication**: Public

**Response** (200):
```json
{
  "queueRunning": [],
  "queuePending": [],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Glass Try-On History

Manage and retrieve ComfyUI-processed glass try-on history records.

### 1. Get Try-On History

Retrieve paginated list of glass try-on history for the current user.

**Endpoint**: `GET /api/glass-tryon-history`  
**Authentication**: Required

**Query Parameters**:
- `savedTryOn` (optional): Filter by saved status (`true`, `false`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response** (200):
```json
{
  "data": [
    {
      "id": "c1e5d890-1234-5678-90ab-123456789abc",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
      "glasses": {
        "id": "42a793e7-54d6-4550-8020-33695a15fb91",
        "name": "Jeff BRC1",
        "brand": "Gentle Monster",
        "category": "Glasses",
        "price": "Sold out"
      },
      "prompt": "person wearing stylish eyeglasses",
      "negativePrompt": "blurry, low quality",
      "seed": 42,
      "resultImageUrl": "data:image/png;base64,iVBORw0KGgo...",
      "promptId": "2a24dfdd-ae76-4ce3-96f7-3b83795e2f53",
      "filename": "ComfyUI_00021_.png",
      "processingTime": 30291,
      "imageSize": 224704,
      "savedTryOn": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**cURL Example**:
```bash
# Get all history
curl -X GET 'http://localhost:3001/api/glass-tryon-history' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

# Get only saved try-ons
curl -X GET 'http://localhost:3001/api/glass-tryon-history?savedTryOn=true' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

# Pagination
curl -X GET 'http://localhost:3001/api/glass-tryon-history?page=2&limit=10' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### 2. Get Single History Record

Retrieve a specific glass try-on history record by ID.

**Endpoint**: `GET /api/glass-tryon-history/{id}`  
**Authentication**: Required

**Response** (200):
```json
{
  "id": "c1e5d890-1234-5678-90ab-123456789abc",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
  "glasses": {
    "id": "42a793e7-54d6-4550-8020-33695a15fb91",
    "name": "Jeff BRC1",
    "brand": "Gentle Monster"
  },
  "resultImageUrl": "data:image/png;base64,iVBORw0KGgo...",
  "savedTryOn": false,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**cURL Example**:
```bash
curl -X GET 'http://localhost:3001/api/glass-tryon-history/c1e5d890-1234-5678-90ab-123456789abc' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### 3. Update Saved Status

Mark a try-on history record as saved or unsaved.

**Endpoint**: `PUT /api/glass-tryon-history/{id}/saved-status`  
**Authentication**: Required

**Request Body**:
```json
{
  "savedTryOn": true
}
```

**Response** (200):
```json
{
  "id": "c1e5d890-1234-5678-90ab-123456789abc",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
  "savedTryOn": true,
  "updatedAt": "2024-01-15T10:35:00.000Z"
}
```

**cURL Example**:
```bash
curl -X PUT 'http://localhost:3001/api/glass-tryon-history/c1e5d890-1234-5678-90ab-123456789abc/saved-status' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{"savedTryOn": true}'
```

### 4. Delete History Record

Delete a specific glass try-on history record.

**Endpoint**: `DELETE /api/glass-tryon-history/{id}`  
**Authentication**: Required

**Response** (200):
```json
{
  "message": "Glass try-on history record deleted successfully"
}
```

**cURL Example**:
```bash
curl -X DELETE 'http://localhost:3001/api/glass-tryon-history/c1e5d890-1234-5678-90ab-123456789abc' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### 5. Manual Save (Alternative)

Manually save a try-on result to history (if not using `process-glass` endpoint).

**Endpoint**: `POST /api/glass-tryon-history`  
**Authentication**: Required

**Request Body**:
```json
{
  "promptId": "7cb6261d-3b03-4171-bbd1-a4b256b42404",
  "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
  "resultImageBase64": "data:image/png;base64,iVBORw0KGgo...",
  "filename": "ComfyUI_00001_.png",
  "processingTime": 5432,
  "imageSize": 1024567,
  "prompt": "person wearing stylish eyeglasses",
  "negativePrompt": "blurry, low quality",
  "seed": 42
}
```

**Response** (201):
```json
{
  "success": true,
  "action": "saved",
  "message": "Glass try-on saved successfully",
  "data": {
    "id": "c1e5d890-1234-5678-90ab-123456789abc",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
    "savedTryOn": false
  }
}
```

---

## Glasses Management

Browse and search the glasses catalog. All endpoints are **public** (no authentication required).

### 1. Get All Glasses

Retrieve paginated list of glasses with filtering and search.

**Endpoint**: `GET /api/glasses`  
**Authentication**: Public (optional for favorite status)

**Query Parameters**:
- `search` (optional): Search by name, brand, or category
- `brand` (optional): Filter by brand
- `category` (optional): Filter by category
- `availability` (optional): Filter by availability
- `minPrice` (optional): Minimum price
- `maxPrice` (optional): Maximum price
- `isActive` (optional): Filter by active status (default: `true`)
- `sortBy` (optional): Sort field (`name`, `brand`, `price`, `createdAt`, default: `createdAt`)
- `sortOrder` (optional): Sort order (`ASC`, `DESC`, default: `DESC`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response** (200):
```json
{
  "data": [
    {
      "id": "42a793e7-54d6-4550-8020-33695a15fb91",
      "name": "Jeff BRC1",
      "brand": "Gentle Monster",
      "category": "Glasses",
      "price": "Sold out",
      "imageUrl": "https://...",
      "productUrl": "https://...",
      "allImages": ["https://..._D_45.jpg", "https://..._FRONT.jpg"],
      "availability": null,
      "isActive": true,
      "isFavorite": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**cURL Examples**:
```bash
# Get all glasses
curl -X GET 'http://localhost:3001/api/glasses'

# Search glasses
curl -X GET 'http://localhost:3001/api/glasses?search=Jeff'

# Filter by brand
curl -X GET 'http://localhost:3001/api/glasses?brand=Gentle%20Monster'

# Filter by price range
curl -X GET 'http://localhost:3001/api/glasses?minPrice=100&maxPrice=500'

# Sort by name
curl -X GET 'http://localhost:3001/api/glasses?sortBy=name&sortOrder=ASC'

# With authentication (includes favorite status)
curl -X GET 'http://localhost:3001/api/glasses' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### 2. Get Glass by ID

Retrieve detailed information about a specific glass.

**Endpoint**: `GET /api/glasses/{id}`  
**Authentication**: Public (optional for favorite status)

**Response** (200):
```json
{
  "id": "42a793e7-54d6-4550-8020-33695a15fb91",
  "name": "Jeff BRC1",
  "brand": "Gentle Monster",
  "category": "Glasses",
  "price": "Sold out",
  "imageUrl": "https://...",
  "productUrl": "https://www.gentlemonster.com/...",
  "allImages": [
    "https://..._D_45.jpg",
    "https://..._FRONT.jpg",
    "https://..._SIDE.jpg"
  ],
  "availability": null,
  "isActive": true,
  "isFavorite": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 3. Get Available Brands

Get list of all unique brands.

**Endpoint**: `GET /api/glasses/brands/available`  
**Authentication**: Public

**Response** (200):
```json
{
  "brands": ["Gentle Monster", "Ray-Ban", "Oakley", "Gucci"],
  "count": 4
}
```

### 4. Get Available Categories

Get list of all unique categories.

**Endpoint**: `GET /api/glasses/categories/available`  
**Authentication**: Public

**Response** (200):
```json
{
  "categories": ["Glasses", "Sunglasses", "Reading Glasses"],
  "count": 3
}
```

### 5. Get Glasses by Brand

Retrieve glasses filtered by a specific brand.

**Endpoint**: `GET /api/glasses/brand/{brandName}`  
**Authentication**: Public

**Query Parameters**:
- `page`, `limit`, `sortBy`, `sortOrder` (same as "Get All Glasses")

**Response**: Same format as "Get All Glasses"

### 6. Get Glasses by Category

Retrieve glasses filtered by a specific category.

**Endpoint**: `GET /api/glasses/category/{categoryName}`  
**Authentication**: Public

**Query Parameters**:
- `page`, `limit`, `sortBy`, `sortOrder` (same as "Get All Glasses")

**Response**: Same format as "Get All Glasses"

### 7. Toggle Favorite

Add or remove a glass from user's favorites.

**Endpoint**: `POST /api/glasses/{id}/favorite`  
**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "action": "added",
  "message": "Glass added to favorites",
  "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**cURL Example**:
```bash
curl -X POST 'http://localhost:3001/api/glasses/42a793e7-54d6-4550-8020-33695a15fb91/favorite' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### 8. Get User Favorites

Retrieve user's favorited glasses.

**Endpoint**: `GET /api/glasses/favorites/me`  
**Authentication**: Required

**Query Parameters**:
- `page`, `limit`, `sortBy`, `sortOrder` (same as "Get All Glasses")

**Response**: Same format as "Get All Glasses" with `isFavorite: true` for all items

---

## Virtual Try-On History

Simple tracking for virtual try-on attempts (separate from ComfyUI glass try-on history).

### 1. Save Try-On

Record a try-on attempt.

**Endpoint**: `POST /api/tryon/save`  
**Authentication**: Required

**Request Body**:
```json
{
  "glassesId": "42a793e7-54d6-4550-8020-33695a15fb91",
  "resultImageUrl": "https://...",
  "metadata": {
    "note": "Looks great!"
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "action": "saved",
  "message": "Try-on saved successfully",
  "data": {
    "id": "d2e5d890-1234-5678-90ab-123456789abc",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "glassesId": "42a793e7-54d6-4550-8020-33695a15fb91",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Get Try-On History

Retrieve try-on history records.

**Endpoint**: `GET /api/tryon/history`  
**Authentication**: Required

**Query Parameters**:
- `glassesId` (optional): Filter by specific glass
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response** (200):
```json
{
  "data": [
    {
      "id": "d2e5d890-1234-5678-90ab-123456789abc",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "glassesId": "42a793e7-54d6-4550-8020-33695a15fb91",
      "resultImageUrl": "https://...",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### 3. Delete Try-On History

Delete a try-on record.

**Endpoint**: `DELETE /api/tryon/history/{id}`  
**Authentication**: Required

**Response** (200):
```json
{
  "message": "Try-on deleted successfully"
}
```

---

## AWS S3 Storage

Generate presigned URLs for secure file uploads/downloads.

### 1. Generate Presigned Upload URL

Get a presigned URL to upload a file directly to S3.

**Endpoint**: `POST /api/s3/presigned-upload-url`  
**Authentication**: Required

**Request Body**:
```json
{
  "fileName": "profile-picture.jpg",
  "fileType": "image/jpeg",
  "folder": "user-uploads",
  "expiresIn": 3600,
  "fileSize": 1048576
}
```

**Response** (200):
```json
{
  "uploadUrl": "https://your-bucket.s3.amazonaws.com/user-uploads/1704067200000_abc123_profile-picture.jpg?...",
  "downloadUrl": "https://your-bucket.s3.amazonaws.com/user-uploads/1704067200000_abc123_profile-picture.jpg?...",
  "key": "user-uploads/1704067200000_abc123_profile-picture.jpg",
  "bucket": "your-bucket",
  "expiresIn": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  },
  "instructions": {
    "upload": "Use the uploadUrl with a PUT request to upload your file directly to S3",
    "download": "Use the downloadUrl to access the uploaded file",
    "contentType": "Make sure to set Content-Type header when uploading"
  }
}
```

**Upload to S3 Example**:
```bash
# First, get presigned URL
RESPONSE=$(curl -X POST 'http://localhost:3001/api/s3/presigned-upload-url' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"fileName": "image.jpg", "fileType": "image/jpeg", "folder": "uploads"}')

UPLOAD_URL=$(echo $RESPONSE | jq -r '.uploadUrl')

# Then, upload file to S3
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @image.jpg
```

### 2. Generate Presigned Download URL

Get a presigned URL to download a file from S3.

**Endpoint**: `POST /api/s3/presigned-download-url`  
**Authentication**: Required

**Request Body**:
```json
{
  "key": "user-uploads/1704067200000_abc123_profile-picture.jpg",
  "expiresIn": 86400
}
```

**Response** (200):
```json
{
  "downloadUrl": "https://your-bucket.s3.amazonaws.com/user-uploads/1704067200000_abc123_profile-picture.jpg?...",
  "key": "user-uploads/1704067200000_abc123_profile-picture.jpg",
  "bucket": "your-bucket",
  "expiresIn": 86400
}
```

---

## Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    "email must be a valid email address",
    "password must be longer than 8 characters"
  ]
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 500 | Internal Server Error | Server error |

### Error Examples

**Invalid Authentication**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Resource Not Found**:
```json
{
  "statusCode": 404,
  "message": "Glass with ID 42a793e7-54d6-4550-8020-33695a15fb91 not found",
  "error": "Not Found"
}
```

**Validation Error**:
```json
{
  "statusCode": 400,
  "message": [
    "glassId must be a UUID",
    "prompt must be a string"
  ],
  "error": "Bad Request"
}
```

---

## Workflow Examples

### Complete Glass Try-On Workflow

```bash
# 1. Sign in and get token
TOKEN=$(curl -X POST 'http://localhost:3001/auth/signin' \
  -H 'Content-Type: application/json' \
  -d '{"email": "user@example.com", "password": "pass"}' \
  | jq -r '.access_token')

# 2. Browse glasses catalog
curl -X GET 'http://localhost:3001/api/glasses?search=Jeff'

# 3. Process a glass through ComfyUI
HISTORY=$(curl -X POST 'http://localhost:3001/api/comfyui/process-glass' \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "glassId": "42a793e7-54d6-4550-8020-33695a15fb91",
    "prompt": "person wearing stylish eyeglasses, professional portrait",
    "seed": 42
  }')

# 4. Extract history ID from response
HISTORY_ID=$(echo $HISTORY | jq -r '.id')

# 5. If user likes it, mark as saved
curl -X PUT "http://localhost:3001/api/glass-tryon-history/$HISTORY_ID/saved-status" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"savedTryOn": true}'

# 6. View saved try-ons
curl -X GET 'http://localhost:3001/api/glass-tryon-history?savedTryOn=true' \
  -H "Authorization: Bearer $TOKEN"
```

### Favorite Glasses Workflow

```bash
# Get token
TOKEN=$(curl -X POST 'http://localhost:3001/auth/signin' \
  -H 'Content-Type: application/json' \
  -d '{"email": "user@example.com", "password": "pass"}' \
  | jq -r '.access_token')

# Add glass to favorites
curl -X POST 'http://localhost:3001/api/glasses/42a793e7-54d6-4550-8020-33695a15fb91/favorite' \
  -H "Authorization: Bearer $TOKEN"

# View favorites
curl -X GET 'http://localhost:3001/api/glasses/favorites/me' \
  -H "Authorization: Bearer $TOKEN"

# Remove from favorites (same endpoint, toggles)
curl -X POST 'http://localhost:3001/api/glasses/42a793e7-54d6-4550-8020-33695a15fb91/favorite' \
  -H "Authorization: Bearer $TOKEN"
```

---

## Rate Limiting & Best Practices

### Best Practices

1. **Always validate JWT tokens** before making authenticated requests
2. **Use pagination** for large datasets
3. **Cache static data** (brands, categories) on the client
4. **Compress images** before uploading to S3
5. **Handle errors gracefully** with proper user feedback
6. **Use appropriate HTTP methods** (GET for reads, POST for creates, PUT for updates, DELETE for deletes)
7. **Include `Content-Type` headers** for all POST/PUT requests
8. **Monitor processing times** for ComfyUI operations (can take 20-60 seconds)

### Performance Tips

- **ComfyUI processing**: Can take 20-60 seconds depending on image size and complexity
- **Image size**: Keep images under 10MB for best performance
- **Pagination**: Use reasonable limits (20-50 items per page)
- **Caching**: Glass catalog data can be cached for 5-10 minutes

---

## Support & Additional Resources

- **Swagger Documentation**: `http://localhost:3001/api/docs`
- **ComfyUI Guides**: See `COMFYUI_INTEGRATION_GUIDE.md`
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **Docker Setup**: See `DOCKER_GUIDE.md`

For issues or questions, refer to the main `README.md` or contact the development team.

