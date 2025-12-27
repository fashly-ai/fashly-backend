# FASHN Try-On API - Frontend Integration Guide

## Quick Start

### 1. Connect to WebSocket

```javascript
const socket = io('http://localhost:3001/fashn-jobs');

// Subscribe to your user's updates
socket.emit('subscribe', userId);
```

### 2. Listen for Events

```javascript
// Job completed - get result image
socket.on('job-completed', (data) => {
  console.log('Result:', data.resultImageUrl);
});

// Job failed
socket.on('job-failed', (data) => {
  console.error('Error:', data.errorMessage);
});

// Progress updates
socket.on('job-update', (data) => {
  console.log(`${data.status}: ${data.progress}%`);
});
```

### 3. Submit Try-On Job

```javascript
const response = await fetch('/api/fashn/tryon/queue', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    modelImageUrl: 'https://example.com/model.jpg',
    upperGarmentUrl: 'https://example.com/top.jpg',
    lowerGarmentUrl: 'https://example.com/bottom.jpg',
  }),
});

const { jobId } = await response.json();
// Now wait for WebSocket 'job-completed' event!
```

---

## API Reference

### POST `/api/fashn/tryon/queue`

**Request:**
```json
{
  "modelImageUrl": "https://...",
  "upperGarmentUrl": "https://...",
  "lowerGarmentUrl": "https://...",
  "seed": 42,
  "mode": "quality",
  "saveToHistory": true
}
```

**Response:**
```json
{
  "jobId": "uuid-here",
  "status": "pending",
  "message": "Try-on job queued successfully"
}
```

---

## WebSocket Events

| Event | When | Key Data |
|-------|------|----------|
| `job-completed` | Success | `resultImageUrl`, `processingTime` |
| `job-failed` | Error | `errorMessage` |
| `job-update` | Any change | `status`, `progress` |

### Event Payload

```typescript
{
  jobId: string;
  status: 'pending' | 'processing_upper' | 'processing_lower' | 'completed' | 'failed';
  progress: number;        // 0, 25, 75, 100
  resultImageUrl?: string; // Final result (when completed)
  errorMessage?: string;   // Error details (when failed)
  processingTime?: number; // ms (when completed)
}
```

---

## React Example

```tsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export function useFashnTryOn(userId: string, token: string) {
  const [status, setStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io('http://localhost:3001/fashn-jobs');
    
    socket.on('connect', () => socket.emit('subscribe', userId));
    
    socket.on('job-completed', (data) => {
      setStatus('completed');
      setProgress(100);
      setResult(data.resultImageUrl);
    });
    
    socket.on('job-failed', (data) => {
      setStatus('failed');
      setError(data.errorMessage);
    });
    
    socket.on('job-update', (data) => {
      setStatus(data.status);
      setProgress(data.progress);
    });

    return () => { socket.disconnect(); };
  }, [userId]);

  const submit = async (modelUrl: string, topUrl: string, bottomUrl: string) => {
    setStatus('submitting');
    setResult(null);
    setError(null);

    const res = await fetch('/api/fashn/tryon/queue', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        modelImageUrl: modelUrl,
        upperGarmentUrl: topUrl,
        lowerGarmentUrl: bottomUrl,
      }),
    });

    const { jobId } = await res.json();
    setStatus('pending');
    return jobId;
  };

  return { status, progress, result, error, submit };
}
```

**Usage:**
```tsx
function TryOnPage() {
  const { status, progress, result, error, submit } = useFashnTryOn(userId, token);

  return (
    <div>
      <button onClick={() => submit(modelUrl, topUrl, bottomUrl)}>
        Try On
      </button>
      
      {status !== 'idle' && <p>{status} - {progress}%</p>}
      {result && <img src={result} alt="Result" />}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

---

## Flow Diagram

```
Frontend                          Backend
   │                                 │
   ├─── Connect WebSocket ──────────►│
   ├─── emit('subscribe', id) ──────►│
   │                                 │
   ├─── POST /tryon/queue ──────────►│
   │◄── { jobId, status } ───────────┤
   │                                 │
   │    (processing in background)   │
   │                                 │
   │◄── job-update (25%) ────────────┤
   │◄── job-update (75%) ────────────┤
   │◄── job-completed ───────────────┤
   │                                 │
   └── Display resultImageUrl        │
```

