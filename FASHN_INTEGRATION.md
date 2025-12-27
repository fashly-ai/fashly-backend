# FASHN Virtual Try-On Integration Guide

This guide explains how to use the FASHN API integration for full-body virtual try-on with upper and lower garments.

## Overview

The FASHN integration allows you to generate realistic virtual try-on images by providing:
- A full-body model image (person)
- An upper garment image (shirt, jacket, etc.)
- A lower garment image (pants, skirt, etc.)

The system uses the FASHN API `tryon-v1.6` model to generate realistic try-on results.

**How it works:**
Since FASHN's API supports one garment at a time, the service makes **two sequential try-on calls**:
1. First, tries on the upper garment (tops) on the model image
2. Then, tries on the lower garment (bottoms) on the result from step 1

This approach ensures both garments are realistically applied to the model.

## Table of Contents

1. [Configuration](#configuration)
2. [API Endpoints](#api-endpoints)
3. [Usage Examples](#usage-examples)
4. [Database Schema](#database-schema)
5. [Error Handling](#error-handling)

---

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# FASHN API Configuration
FASHN_API_KEY=fa-1BU2kOVYJkAo-JLdNwP7LhsIDbYgPLksqE6R0
```

Your API key is already configured in `env.example`.

### Database Migration

Run the database migration to create the FASHN history table:

```bash
npm run migration:run
```

This will create the `fashn_history` table with the following structure:
- User virtual try-on history
- Model, garment, and result image URLs
- Processing metadata
- Save/favorite functionality

---

## API Endpoints

All endpoints require JWT authentication. Include your bearer token in the `Authorization` header.

**Base Path:** `/api/fashn`

### 1. Generate Virtual Try-On

**POST** `/api/fashn/tryon`

Generate a virtual try-on with full body and upper/lower garments.

**Request Body:**
```json
{
  "modelImageUrl": "https://example.com/model-fullbody.jpg",
  "upperGarmentUrl": "https://example.com/shirt.jpg",
  "lowerGarmentUrl": "https://example.com/pants.jpg",
  "category": "casual",
  "saveToHistory": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "outputImageUrl": "https://fashn.ai/outputs/tryon-12345.jpg",
  "predictionId": "pred_lower_abc123xyz",
  "processingTime": 10864,
  "model": "tryon-v1.6",
  "metadata": {
    "status": "completed",
    "upperPredictionId": "pred_upper_xyz789",
    "creditsUsed": 2
  },
  "historyId": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Note:** 
- `processingTime` includes both upper and lower garment try-on operations
- `predictionId` is from the final (lower garment) try-on
- `metadata.upperPredictionId` contains the prediction ID from the first (upper garment) try-on
- `metadata.creditsUsed` shows total credits consumed (typically 2: 1 for upper + 1 for lower)

**cURL Example:**
```bash
curl -X POST http://localhost:3001/api/fashn/tryon \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelImageUrl": "https://example.com/model.jpg",
    "upperGarmentUrl": "https://example.com/shirt.jpg",
    "lowerGarmentUrl": "https://example.com/pants.jpg",
    "saveToHistory": true
  }'
```

---

### 2. Check Prediction Status

**GET** `/api/fashn/predictions/:predictionId`

Check the status of a FASHN prediction (useful for async processing).

**Response (200 OK):**
```json
{
  "status": "completed",
  "predictionId": "pred_abc123xyz",
  "outputImageUrl": "https://fashn.ai/outputs/tryon-12345.jpg",
  "progress": 100
}
```

**Status Values:**
- `queued` - Prediction is queued (progress: 0)
- `processing` - Prediction is processing (progress: 50)
- `completed` - Prediction completed (progress: 100)
- `failed` - Prediction failed (error message provided)

---

### 3. Get User History

**GET** `/api/fashn/history?page=1&limit=20&savedOnly=false`

Retrieve the authenticated user's FASHN try-on history.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `savedOnly` (optional): Filter by saved items only (default: false)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "hist_123",
      "modelImageUrl": "https://example.com/model.jpg",
      "upperGarmentUrl": "https://example.com/upper.jpg",
      "lowerGarmentUrl": "https://example.com/lower.jpg",
      "resultImageUrl": "https://fashn.ai/outputs/result.jpg",
      "predictionId": "pred_abc123",
      "processingTime": 5432,
      "isSaved": false,
      "createdAt": "2025-11-30T10:00:00Z",
      "updatedAt": "2025-11-30T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### 4. Get Specific History Record

**GET** `/api/fashn/history/:historyId`

Retrieve a specific FASHN try-on history record.

**Response (200 OK):**
```json
{
  "id": "hist_123",
  "modelImageUrl": "https://example.com/model.jpg",
  "upperGarmentUrl": "https://example.com/upper.jpg",
  "lowerGarmentUrl": "https://example.com/lower.jpg",
  "resultImageUrl": "https://fashn.ai/outputs/result.jpg",
  "predictionId": "pred_abc123",
  "processingTime": 5432,
  "isSaved": true,
  "createdAt": "2025-11-30T10:00:00Z",
  "updatedAt": "2025-11-30T10:15:00Z"
}
```

---

### 5. Update Saved Status

**PATCH** `/api/fashn/history/:historyId/saved`

Save or unsave a FASHN try-on history record.

**Request Body:**
```json
{
  "isSaved": true
}
```

**Response (200 OK):**
```json
{
  "id": "hist_123",
  "modelImageUrl": "https://example.com/model.jpg",
  "upperGarmentUrl": "https://example.com/upper.jpg",
  "lowerGarmentUrl": "https://example.com/lower.jpg",
  "resultImageUrl": "https://fashn.ai/outputs/result.jpg",
  "predictionId": "pred_abc123",
  "processingTime": 5432,
  "isSaved": true,
  "createdAt": "2025-11-30T10:00:00Z",
  "updatedAt": "2025-11-30T10:15:00Z"
}
```

---

### 6. Delete History Record

**DELETE** `/api/fashn/history/:historyId`

Delete a specific FASHN try-on history record.

**Response (204 No Content)**

---

### 7. Get History Count

**GET** `/api/fashn/history/stats/count`

Get the total count of FASHN try-on history records.

**Response (200 OK):**
```json
{
  "total": 42,
  "saved": 15
}
```

---

## Usage Examples

### TypeScript/JavaScript Client Example

```typescript
import axios from 'axios';

const API_URL = 'https://your-api.com/api';
const authToken = 'your-jwt-token';

// Generate virtual try-on
async function generateTryOn() {
  try {
    const response = await axios.post(
      `${API_URL}/fashn/tryon`,
      {
        modelImageUrl: 'https://example.com/model-fullbody.jpg',
        upperGarmentUrl: 'https://example.com/shirt.jpg',
        lowerGarmentUrl: 'https://example.com/pants.jpg',
        category: 'casual',
        saveToHistory: true,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Try-on result:', response.data.outputImageUrl);
    console.log('Processing time:', response.data.processingTime, 'ms');
    
    if (response.data.historyId) {
      console.log('Saved to history:', response.data.historyId);
    }
  } catch (error) {
    console.error('Error generating try-on:', error.response?.data || error.message);
  }
}

// Get user history
async function getUserHistory(page = 1, limit = 20) {
  try {
    const response = await axios.get(
      `${API_URL}/fashn/history?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    console.log('Total records:', response.data.pagination.total);
    console.log('History items:', response.data.data);
  } catch (error) {
    console.error('Error fetching history:', error.response?.data || error.message);
  }
}

// Save a try-on to favorites
async function saveToFavorites(historyId: string) {
  try {
    const response = await axios.patch(
      `${API_URL}/fashn/history/${historyId}/saved`,
      { isSaved: true },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Saved to favorites:', response.data);
  } catch (error) {
    console.error('Error saving to favorites:', error.response?.data || error.message);
  }
}
```

---

## Database Schema

### `fashn_history` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users table |
| `model_image_url` | TEXT | Full-body model image URL |
| `upper_garment_url` | TEXT | Upper garment image URL |
| `lower_garment_url` | TEXT | Lower garment image URL |
| `result_image_url` | TEXT | Generated try-on result URL |
| `prediction_id` | VARCHAR(255) | FASHN prediction ID |
| `processing_time` | INTEGER | Processing time in milliseconds |
| `category` | VARCHAR(100) | Optional category (casual, formal, etc.) |
| `is_saved` | BOOLEAN | Whether the item is saved/favorited |
| `model_name` | VARCHAR(100) | FASHN model name (default: tryon-v1.6) |
| `metadata` | JSONB | Additional metadata from FASHN API |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Indexes:**
- `IDX_fashn_history_user_id` - on `user_id`
- `IDX_fashn_history_user_id_created_at` - composite index for pagination

---

## Error Handling

### Common Error Responses

**400 Bad Request - Upper Garment Failed**
```json
{
  "statusCode": 400,
  "message": "Upper garment try-on failed: ImageLoadError",
  "error": "Bad Request"
}
```

**400 Bad Request - Lower Garment Failed**
```json
{
  "statusCode": 400,
  "message": "Lower garment try-on failed: PoseError",
  "error": "Bad Request"
}
```

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "History record with ID hist_123 not found",
  "error": "Not Found"
}
```

**Rate Limit Exceeded**
```json
{
  "statusCode": 400,
  "message": "FASHN API rate limit exceeded. Please try again later.",
  "error": "Bad Request"
}
```

### Error Handling Best Practices

1. **Validate Image URLs**: Ensure all image URLs are publicly accessible
2. **Check Response Status**: Always check for `status === 'completed'` before using output
3. **Handle Async Processing**: Use prediction status endpoint for long-running operations
4. **Retry Logic**: Implement exponential backoff for rate limit errors
5. **User Feedback**: Show processing time and progress to users

---

## Image Requirements

### Model Image (Full Body)
- **Format**: JPEG, PNG, WebP
- **Size**: Minimum 512x512px, recommended 1024x1024px
- **Content**: Full-body person image
- **Background**: Preferably clean/simple background

### Garment Images (Upper & Lower)
- **Format**: JPEG, PNG, WebP  
- **Size**: Minimum 512x512px
- **Content**: Clear image of the garment
- **Background**: White or transparent background recommended

---

## API Rate Limits

FASHN API has rate limits. Monitor your usage and implement:
- Request queuing for bulk operations
- Exponential backoff on 429 errors
- Caching of frequently used results

**Important:** Each full-body try-on uses **2 API credits** (1 for upper + 1 for lower garment). Plan your usage accordingly.

---

## Support

For FASHN API issues:
- Documentation: https://docs.fashn.ai/
- API Status: Check FASHN status page
- Support: Contact FASHN support team

For integration issues:
- Check application logs
- Verify environment configuration
- Ensure database migrations are up to date

---

## Next Steps

1. **Run the migration**: `npm run migration:run`
2. **Test the API**: Use Swagger docs at `/api/docs`
3. **Monitor usage**: Track processing times and success rates
4. **Optimize images**: Pre-process images for faster results
5. **Implement caching**: Cache results for frequently used combinations

Enjoy building amazing virtual try-on experiences! 🎉

