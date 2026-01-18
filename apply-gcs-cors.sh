#!/bin/bash

# Script to apply CORS configuration to Google Cloud Storage bucket

# Your GCS bucket name (change this to match your bucket)
BUCKET_NAME="fashly-demo"

echo "========================================"
echo "Applying CORS to GCS Bucket: ${BUCKET_NAME}"
echo "========================================"
echo ""

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ Error: gsutil is not installed or not in PATH"
    echo ""
    echo "Please install Google Cloud SDK:"
    echo "  macOS: brew install google-cloud-sdk"
    echo "  Or visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if CORS config file exists
if [ ! -f "gcs-cors.json" ]; then
    echo "❌ Error: gcs-cors.json not found"
    echo "Please make sure gcs-cors.json exists in the current directory"
    exit 1
fi

echo "📄 CORS Configuration:"
cat gcs-cors.json
echo ""
echo ""

# Apply CORS configuration
echo "🔧 Applying CORS configuration to bucket: ${BUCKET_NAME}"
gsutil cors set gcs-cors.json gs://${BUCKET_NAME}

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ CORS configuration applied successfully!"
    echo ""
    echo "Verifying CORS configuration:"
    gsutil cors get gs://${BUCKET_NAME}
    echo ""
    echo "========================================"
    echo "✅ Done! Your bucket is now CORS-enabled"
    echo "========================================"
else
    echo ""
    echo "❌ Failed to apply CORS configuration"
    echo ""
    echo "Make sure you:"
    echo "  1. Are authenticated: gcloud auth login"
    echo "  2. Have permissions on the bucket"
    echo "  3. The bucket name is correct: ${BUCKET_NAME}"
fi


