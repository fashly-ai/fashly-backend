# 🐳 Docker Deployment Guide

This guide explains how to deploy the Fashionfy Demo Integration application using Docker and Docker Compose.

## 📋 Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- At least 2GB of available RAM
- At least 5GB of available disk space

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd demo-integration

# Make the setup script executable (if not already)
chmod +x scripts/docker-setup.sh

# Run the automated setup
./scripts/docker-setup.sh setup prod
```

### 2. Manual Setup (Alternative)

If you prefer manual setup:

```bash
# Copy environment template
cp env.example .env

# Edit environment variables
nano .env

# Start services
docker-compose up -d

# Run database migrations
docker-compose exec app pnpm run migration:run
```

## 🏗️ Docker Architecture

### Services Overview

| Service | Description | Port | Health Check |
|---------|-------------|------|--------------|
| **app** | NestJS Application | 3001 | `/api/health` |
| **postgres** | PostgreSQL Database | 5432 | `pg_isready` |
| **redis** | Redis Cache (optional) | 6379 | `redis-cli ping` |
| **nginx** | Reverse Proxy (optional) | 80/443 | `/health` |

### Network Architecture

```
┌─────────────────┐    ┌─────────────────┐
│     nginx       │    │      app        │
│   (port 80)     │────│   (port 3001)   │
└─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │    postgres     │
                       │   (port 5432)   │
                       └─────────────────┘
                                │
                       ┌─────────────────┐
                       │     redis       │
                       │   (port 6379)   │
                       └─────────────────┘
```

## 📁 Docker Files Overview

### Core Files

- **`Dockerfile`** - Production container build
- **`Dockerfile.dev`** - Development container build
- **`docker-compose.yml`** - Production services configuration
- **`docker-compose.dev.yml`** - Development services configuration
- **`.dockerignore`** - Files to exclude from Docker context
- **`nginx.conf`** - Nginx reverse proxy configuration

### Helper Files

- **`scripts/docker-setup.sh`** - Automated setup script
- **`scripts/init-db.sql`** - Database initialization script

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env` file with the following variables:

```env
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=fashly

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=24h

# HuggingFace Configuration
HF_TOKEN=your-huggingface-token

# Google Cloud Storage Configuration
GCP_PROJECT_ID=your-gcp-project-id
GCS_BUCKET_NAME=your-gcs-bucket-name
GCP_KEY_FILE=/app/gcp-key.json

# Application Configuration
NODE_ENV=production
PORT=3001
```

### GCP Service Account Setup

If using file-based authentication for Google Cloud Storage:

1. Create a service account in your GCP project
2. Download the JSON key file
3. Place it in your project root as `gcp-key.json`
4. Set `GCP_KEY_FILE_HOST_PATH=./gcp-key.json` in your `.env` file

## 🚀 Deployment Modes

### Production Deployment

```bash
# Start production services
docker-compose up -d

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec app pnpm run migration:run

# Scale the application (if needed)
docker-compose up -d --scale app=3
```

### Development Deployment

```bash
# Start development services with hot reload
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Access debugging on port 9229
# Connect your IDE debugger to localhost:9229
```

### With Nginx Reverse Proxy

```bash
# Start with nginx profile
docker-compose --profile with-nginx up -d

# Services will be available at:
# - http://localhost (nginx proxy)
# - http://localhost:3001 (direct app access)
```

## 🛠️ Management Commands

### Using the Helper Script

```bash
# Setup development environment
./scripts/docker-setup.sh setup dev

# Setup production environment
./scripts/docker-setup.sh setup prod

# Start services
./scripts/docker-setup.sh start [dev|prod]

# Stop services
./scripts/docker-setup.sh stop

# View logs
./scripts/docker-setup.sh logs [service-name]

# Run migrations
./scripts/docker-setup.sh migrate

# Clean up everything
./scripts/docker-setup.sh cleanup
```

### Manual Docker Commands

```bash
# Build images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Execute commands in containers
docker-compose exec app pnpm run migration:run
docker-compose exec postgres psql -U postgres -d fashly

# Scale services
docker-compose up -d --scale app=2

# Update services
docker-compose pull
docker-compose up -d
```

## 📊 Monitoring and Health Checks

### Health Check Endpoints

- **Application**: `GET /api/health`
- **Database**: Built-in PostgreSQL health check
- **Redis**: Built-in Redis health check
- **Nginx**: `GET /health`

### Viewing Service Status

```bash
# Check service status
docker-compose ps

# Check service health
docker-compose exec app curl -f http://localhost:3001/api/health

# View resource usage
docker stats

# Check logs
docker-compose logs --tail=100 app
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Check what's using the port
lsof -i :3001
# or
netstat -tulpn | grep 3001

# Stop conflicting services or change ports in docker-compose.yml
```

#### 2. Database Connection Issues

```bash
# Check database logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres psql -U postgres -d fashly -c "SELECT version();"

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### 3. Out of Memory

```bash
# Check container resource usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Or add memory limits to docker-compose.yml:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
```

#### 4. Build Issues

```bash
# Clean build cache
docker builder prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check build logs
docker-compose build app
```

### Log Analysis

```bash
# Follow all logs
docker-compose logs -f

# Filter logs by service
docker-compose logs -f app

# Search logs
docker-compose logs app | grep ERROR

# Export logs
docker-compose logs --no-color app > app.log
```

## 🔐 Security Considerations

### Production Security

1. **Environment Variables**: Never commit `.env` files to version control
2. **Secrets Management**: Use Docker secrets or external secret management
3. **Network Security**: Use internal networks for service communication
4. **Container Security**: Run containers as non-root users (already configured)
5. **Image Security**: Regularly update base images and dependencies

### Nginx Security Headers

The included `nginx.conf` includes security headers:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

## 📈 Performance Optimization

### Production Optimizations

1. **Multi-stage Builds**: Dockerfile uses multi-stage builds to reduce image size
2. **Caching**: Proper layer caching for faster builds
3. **Resource Limits**: Configure appropriate memory and CPU limits
4. **Connection Pooling**: PostgreSQL connection pooling configured

### Scaling

```bash
# Scale application horizontally
docker-compose up -d --scale app=3

# Use nginx for load balancing
docker-compose --profile with-nginx up -d --scale app=3
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build and Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and Deploy
        run: |
          docker-compose build
          docker-compose up -d
          docker-compose exec -T app pnpm run migration:run
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/recipes/docker)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs: `docker-compose logs -f`
3. Ensure all environment variables are set correctly
4. Verify Docker and Docker Compose versions meet requirements

For additional help, please refer to the main project documentation or create an issue in the repository.
