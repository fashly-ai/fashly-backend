#!/bin/bash

# Fashly Backend Deployment Script
# This script pulls the latest code, runs migrations, builds, and restarts the application

set -e  # Exit on any error

echo "🚀 Starting Fashly Backend Deployment..."

# Configuration
APP_DIR="${APP_DIR:-/opt/fashly-backend}"
SERVICE_NAME="${SERVICE_NAME:-fashly-backend}"
BRANCH="${BRANCH:-main}"
NODE_ENV="${NODE_ENV:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists git; then
    print_error "Git is not installed"
    exit 1
fi

if ! command_exists node; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command_exists pnpm; then
    print_error "pnpm is not installed"
    exit 1
fi

# Navigate to application directory
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory $APP_DIR does not exist"
    exit 1
fi

cd "$APP_DIR"
print_status "Changed to directory: $(pwd)"

# Stop the application service if it's running
print_status "Stopping application service..."
if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    sudo systemctl stop "$SERVICE_NAME"
    print_status "Service $SERVICE_NAME stopped"
else
    print_warning "Service $SERVICE_NAME was not running"
fi

# Pull latest changes
print_status "Pulling latest changes from $BRANCH branch..."
git fetch origin
git reset --hard "origin/$BRANCH"
git clean -fd

# Get the latest commit info
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=format:'%s')
print_status "Deploying commit $COMMIT_HASH: $COMMIT_MESSAGE"

# Install dependencies
print_status "Installing dependencies..."
pnpm install --frozen-lockfile

# Note: .env file should be created by GitHub Actions or manually
# This script assumes .env exists or will be created by the deployment process

# Run database migrations
print_status "Running database migrations..."
pnpm run migration:run

# Build application
print_status "Building application..."
pnpm run build

# Run tests (optional, comment out if not needed in production)
print_status "Running tests..."
if pnpm run test --passWithNoTests; then
    print_status "All tests passed"
else
    print_warning "Some tests failed, but continuing deployment"
fi

# Start the application service
print_status "Starting application service..."
sudo systemctl start "$SERVICE_NAME"

# Wait for service to start
print_status "Waiting for service to start..."
sleep 5

# Check if service is running
if systemctl is-active --quiet "$SERVICE_NAME"; then
    print_status "Service $SERVICE_NAME is running"
else
    print_error "Service $SERVICE_NAME failed to start"
    sudo systemctl status "$SERVICE_NAME"
    exit 1
fi

# Health check
print_status "Running health check..."
MAX_ATTEMPTS=12
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Health check passed!"
        break
    else
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            print_error "Health check failed after $MAX_ATTEMPTS attempts"
            sudo systemctl status "$SERVICE_NAME"
            exit 1
        else
            print_warning "Health check attempt $ATTEMPT/$MAX_ATTEMPTS failed, retrying in 5 seconds..."
            sleep 5
            ATTEMPT=$((ATTEMPT + 1))
        fi
    fi
done

# Success message
print_status "🎉 Deployment completed successfully!"
print_status "Application is running at: http://localhost:3000"
print_status "API Documentation: http://localhost:3000/api/docs"
print_status "Deployed commit: $COMMIT_HASH"

# Optional: Show recent logs
print_status "Recent application logs:"
sudo journalctl -u "$SERVICE_NAME" --lines=5 --no-pager
