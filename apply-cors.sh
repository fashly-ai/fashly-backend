#!/bin/bash
# Apply CORS configuration to GCS bucket

BUCKET_NAME="fashly-demo"
CORS_FILE="cors.json"

echo "Applying CORS configuration to bucket: $BUCKET_NAME"
gsutil cors set $CORS_FILE gs://$BUCKET_NAME

echo "Verifying CORS configuration:"
gsutil cors get gs://$BUCKET_NAME
