# FASHN Queue-Based Try-On API with WebSocket Notifications

This guide explains how to use the async/queue-based FASHN Virtual Try-On API with real-time WebSocket notifications.

## Overview

The queue-based API allows you to:
1. **Submit a try-on job** → Returns immediately with a job ID
2. **Receive real-time updates** → Via WebSocket when job status changes
3. **Get notified on completion** → No polling required!

---

## Table of Contents

1. [Setup](#setup)
2. [API Endpoints](#api-endpoints)
3. [WebSocket Events](#websocket-events)
4. [Frontend Integration](#frontend-integration)
5. [Complete Example](#complete-example)

---

## Setup

### 1. Install Dependencies

```bash
cd /Volumes/Work/code/fashionfy/demo-integration
pnpm install
```

### 2. Run Database Migration

```bash
pnpm run migration:run
```

### 3. Start the Server

```bash
pnpm start:dev
```

---

## API Endpoints

### Queue a Try-On Job

**POST** `/api/fashn/tryon/queue`

Submit a try-on job for async processing. Returns immediately with job ID.

#### Request Body

```json
{
  "modelImageUrl": "https://example.com/model-fullbody.jpg",
  "upperGarmentUrl": "https://example.com/top.jpg",
  "lowerGarmentUrl": "https://example.com/bottom.jpg",
  "seed": 42,
  "mode": "quality",
  "saveToHistory": true
}
```

**OR** for combined outfit image:

```json
{
  "modelImageUrl": "https://example.com/model-fullbody.jpg",
  "outfitImageUrl": "https://example.com/outfit-top-and-bottom.jpg",
  "category": "auto",
  "seed": 42,
  "mode": "quality",
  "saveToHistory": true
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modelImageUrl` | string | ✅ | URL of full-body model image |
| `upperGarmentUrl` | string | ❌* | URL of top garment image |
| `lowerGarmentUrl` | string | ❌* | URL of bottom garment image |
| `outfitImageUrl` | string | ❌* | URL of combined outfit image |
| `category` | string | ❌ | `auto`, `tops`, `bottoms`, `one-pieces` (default: `auto`) |
| `seed` | number | ❌ | Random seed for reproducibility |
| `mode` | string | ❌ | `performance`, `balanced`, `quality` (default: `quality`) |
| `saveToHistory` | boolean | ❌ | Save result to history (default: `false`) |

*\*Must provide either `upperGarmentUrl` + `lowerGarmentUrl` OR `outfitImageUrl`*

#### Response

```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "pending",
  "message": "Try-on job queued successfully. Use GET /api/fashn/jobs/:jobId to check status.",
  "createdAt": "2025-12-07T10:30:00Z"
}
```

---

### Check Job Status (REST - Optional)

**GET** `/api/fashn/jobs/:jobId`

You can also poll this endpoint if WebSocket is not available.

#### Response

```json
{
  "jobId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "progress": 100,
  "resultImageUrl": "https://fashn.ai/outputs/result.jpg",
  "upperResultUrl": "https://fashn.ai/outputs/upper-result.jpg",
  "processingTime": 15432,
  "historyId": "hist_abc123",
  "createdAt": "2025-12-07T10:30:00Z",
  "completedAt": "2025-12-07T10:30:15Z",
  "metadata": {
    "creditsUsed": 2
  }
}
```

#### Job Status Values

| Status | Progress | Description |
|--------|----------|-------------|
| `pending` | 0% | Job queued, waiting to start |
| `processing_upper` | 25% | Processing upper garment |
| `processing_lower` | 75% | Processing lower garment |
| `completed` | 100% | Job finished successfully |
| `failed` | 0% | Job failed with error |

---

### List All Jobs

**GET** `/api/fashn/jobs?status=completed&limit=20`

---

### Cancel a Job

**DELETE** `/api/fashn/jobs/:jobId`

---

## WebSocket Events

### Connection

Connect to the WebSocket namespace:

```
ws://localhost:3001/fashn-jobs
```

or with Socket.IO:

```javascript
const socket = io('http://localhost:3001/fashn-jobs');
```

---

### Subscribe to Updates

After connecting, subscribe to receive updates for your user:

```javascript
socket.emit('subscribe', userId);
```

#### Confirmation Event

```javascript
socket.on('subscribed', (data) => {
  console.log(data.message); // "Successfully subscribed to job updates"
});
```

---

### Events You Can Listen To

#### 1. `job-update` - Any Status Change

```javascript
socket.on('job-update', (data) => {
  console.log(`Job ${data.jobId}: ${data.status} (${data.progress}%)`);
});
```

**Payload:**
```typescript
{
  jobId: string;
  userId: string;
  status: 'pending' | 'processing_upper' | 'processing_lower' | 'completed' | 'failed';
  progress: number; // 0, 25, 75, or 100
  resultImageUrl?: string;
  upperResultUrl?: string;
  processingTime?: number;
  errorMessage?: string;
  historyId?: string;
  completedAt?: Date;
  metadata?: object;
}
```

---

#### 2. `job-processing` - Processing Started

```javascript
socket.on('job-processing', (data) => {
  console.log(`Processing ${data.step}: ${data.message}`);
  // "Processing upper: Processing upper garment..."
  // "Processing lower: Processing lower garment..."
});
```

---

#### 3. `job-completed` - Success! 🎉

```javascript
socket.on('job-completed', (data) => {
  console.log('✅ Try-on completed!');
  console.log('Result image:', data.resultImageUrl);
  console.log('Processing time:', data.processingTime, 'ms');
  
  // Display the result image
  displayImage(data.resultImageUrl);
});
```

---

#### 4. `job-failed` - Error Occurred

```javascript
socket.on('job-failed', (data) => {
  console.error('❌ Try-on failed:', data.errorMessage);
  showError(data.errorMessage);
});
```

---

## Frontend Integration

### React Example

```tsx
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface JobStatus {
  jobId: string;
  status: string;
  progress: number;
  resultImageUrl?: string;
  errorMessage?: string;
}

function TryOnComponent({ userId, authToken }: { userId: string; authToken: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Connect to WebSocket on mount
  useEffect(() => {
    const newSocket = io('http://localhost:3001/fashn-jobs');
    
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      newSocket.emit('subscribe', userId);
    });

    newSocket.on('subscribed', (data) => {
      console.log('Subscribed:', data.message);
    });

    newSocket.on('job-update', (data: JobStatus) => {
      console.log('Job update:', data);
      setJobStatus(data);
    });

    newSocket.on('job-completed', (data: JobStatus) => {
      console.log('Job completed!', data);
      setJobStatus(data);
      setIsLoading(false);
    });

    newSocket.on('job-failed', (data: JobStatus) => {
      console.error('Job failed:', data.errorMessage);
      setJobStatus(data);
      setIsLoading(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  // Submit try-on job
  const submitTryOn = async (
    modelUrl: string,
    topUrl: string,
    bottomUrl: string
  ) => {
    setIsLoading(true);
    setJobStatus(null);

    try {
      const response = await fetch('/api/fashn/tryon/queue', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelImageUrl: modelUrl,
          upperGarmentUrl: topUrl,
          lowerGarmentUrl: bottomUrl,
          seed: 42,
          mode: 'quality',
          saveToHistory: true,
        }),
      });

      const data = await response.json();
      console.log('Job queued:', data.jobId);
      
      setJobStatus({
        jobId: data.jobId,
        status: data.status,
        progress: 0,
      });

      // Now just wait for WebSocket events!
      // No polling needed!

    } catch (error) {
      console.error('Failed to queue job:', error);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => submitTryOn(
          'https://example.com/model.jpg',
          'https://example.com/top.jpg',
          'https://example.com/bottom.jpg'
        )}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Try On'}
      </button>

      {jobStatus && (
        <div>
          <p>Status: {jobStatus.status}</p>
          <progress value={jobStatus.progress} max={100} />
          <span>{jobStatus.progress}%</span>

          {jobStatus.status === 'completed' && jobStatus.resultImageUrl && (
            <img src={jobStatus.resultImageUrl} alt="Try-on result" />
          )}

          {jobStatus.status === 'failed' && (
            <p className="error">{jobStatus.errorMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default TryOnComponent;
```

---

### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>FASHN Try-On</title>
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
  <div id="app">
    <button id="tryOnBtn">Try On</button>
    <div id="status"></div>
    <div id="progress"></div>
    <img id="result" style="display: none; max-width: 500px;" />
  </div>

  <script>
    const API_URL = 'http://localhost:3001';
    const AUTH_TOKEN = 'YOUR_JWT_TOKEN';
    const USER_ID = 'YOUR_USER_ID';

    // Connect to WebSocket
    const socket = io(`${API_URL}/fashn-jobs`);

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      socket.emit('subscribe', USER_ID);
    });

    socket.on('subscribed', (data) => {
      console.log('Subscribed:', data.message);
    });

    socket.on('job-update', (data) => {
      document.getElementById('status').textContent = `Status: ${data.status}`;
      document.getElementById('progress').textContent = `Progress: ${data.progress}%`;
    });

    socket.on('job-completed', (data) => {
      document.getElementById('status').textContent = '✅ Completed!';
      document.getElementById('progress').textContent = `Time: ${data.processingTime}ms`;
      
      const img = document.getElementById('result');
      img.src = data.resultImageUrl;
      img.style.display = 'block';
      
      document.getElementById('tryOnBtn').disabled = false;
    });

    socket.on('job-failed', (data) => {
      document.getElementById('status').textContent = `❌ Failed: ${data.errorMessage}`;
      document.getElementById('tryOnBtn').disabled = false;
    });

    // Submit try-on
    document.getElementById('tryOnBtn').addEventListener('click', async () => {
      document.getElementById('tryOnBtn').disabled = true;
      document.getElementById('status').textContent = 'Queuing job...';
      document.getElementById('result').style.display = 'none';

      const response = await fetch(`${API_URL}/api/fashn/tryon/queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelImageUrl: 'https://example.com/model.jpg',
          upperGarmentUrl: 'https://example.com/top.jpg',
          lowerGarmentUrl: 'https://example.com/bottom.jpg',
          seed: 42,
          mode: 'quality',
        }),
      });

      const data = await response.json();
      console.log('Job queued:', data.jobId);
      document.getElementById('status').textContent = `Job queued: ${data.jobId}`;
      
      // WebSocket will handle the rest!
    });
  </script>
</body>
</html>
```

---

## Complete Example

### Full Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. Connect WebSocket → io('/fashn-jobs')                       │
│  2. Subscribe → socket.emit('subscribe', userId)                │
│  3. Submit job → POST /api/fashn/tryon/queue                    │
│  4. Wait for events (no polling!)                               │
│     └─ job-processing (25%, 75%)                                │
│     └─ job-completed (100%) → Show result image                 │
│     └─ job-failed → Show error                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  1. Receive job request                                         │
│  2. Save to database (status: pending)                          │
│  3. Return jobId immediately                                    │
│  4. Process in background:                                      │
│     └─ Step 1: Try on upper garment → emit 'processing_upper'   │
│     └─ Step 2: Try on lower garment → emit 'processing_lower'   │
│  5. On complete → emit 'job-completed' via WebSocket            │
│  6. On error → emit 'job-failed' via WebSocket                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## cURL Example

```bash
# 1. Queue a try-on job
curl -X POST http://localhost:3001/api/fashn/tryon/queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modelImageUrl": "https://example.com/model.jpg",
    "upperGarmentUrl": "https://example.com/top.jpg",
    "lowerGarmentUrl": "https://example.com/bottom.jpg",
    "seed": 42,
    "mode": "quality",
    "saveToHistory": true
  }'

# Response:
# {
#   "jobId": "123e4567-e89b-12d3-a456-426614174000",
#   "status": "pending",
#   "message": "Try-on job queued successfully..."
# }

# 2. Check status (optional - use WebSocket instead!)
curl http://localhost:3001/api/fashn/jobs/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `Upper garment try-on failed` | Invalid image URL or unsupported format | Check image URL is publicly accessible |
| `Lower garment try-on failed` | Pose detection failed | Use clearer model image |
| `Must provide either upperGarmentUrl + lowerGarmentUrl, or outfitImageUrl` | Missing required fields | Provide correct image URLs |

---

## Tips

1. **Use seeds for reproducibility** - Same seed + same images = same result
2. **Quality vs Speed** - Use `mode: "performance"` for faster results
3. **Save to history** - Set `saveToHistory: true` to keep results
4. **Disconnect WebSocket** - Clean up when component unmounts

---

## Support

- API Docs: `http://localhost:3001/api/docs` (Swagger)
- FASHN Docs: https://docs.fashn.ai/

