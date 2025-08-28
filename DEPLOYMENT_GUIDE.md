# Deployment Guide - Fashly Backend

This guide covers different deployment strategies for the Fashly Backend API.

## 🚀 Deployment Options

### 1. GitHub Actions (Automated)
### 2. Manual Server Deployment
### 3. Local Development Deployment

---

## 🤖 GitHub Actions Deployment

### Setup Required Secrets

In your GitHub repository, go to **Settings > Secrets and Variables > Actions** and add:

#### Required Secrets:
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-s3-bucket-name
```

#### For Server Deployment (optional):
```
SERVER_HOST=your-server.com
SERVER_USER=deploy
SERVER_SSH_KEY=your-private-ssh-key
SERVER_PORT=22
APP_DIRECTORY=/opt/fashly-backend
```

### Available Workflows

#### 1. **CI/CD Pipeline** (`.github/workflows/deploy.yml`)
- Triggers on push to `main` branch
- Runs tests, migrations, and health checks
- Suitable for validation and testing

#### 2. **Server Deployment** (`.github/workflows/deploy-server.yml`)
- Deploys to remote server via SSH
- Pulls code, runs migrations, builds, and restarts service
- Production-ready deployment

### Usage

```bash
# Automatic deployment on push to main
git push origin main

# Manual deployment (GitHub UI)
# Go to Actions tab > Deploy to Server > Run workflow
```

---

## 🖥️ Manual Server Deployment

### Prerequisites

1. **Server Setup**:
   ```bash
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install pnpm
   npm install -g pnpm
   
   # Install PostgreSQL
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

2. **Setup Application Service**:
   ```bash
   # Clone repository
   sudo git clone https://github.com/your-username/fashly-backend.git /opt/fashly-backend
   cd /opt/fashly-backend
   
   # Setup systemd service
   sudo ./scripts/setup-service.sh
   ```

3. **Environment Configuration**:
   ```bash
   # Create environment file
   sudo cp env.example /opt/fashly-backend/.env
   sudo nano /opt/fashly-backend/.env
   
   # Set correct ownership
   sudo chown fashly:fashly /opt/fashly-backend/.env
   ```

### Deployment Process

#### Using the Deployment Script:
```bash
# Navigate to app directory
cd /opt/fashly-backend

# Run deployment script
sudo ./scripts/deploy.sh
```

#### Manual Steps:
```bash
# 1. Pull latest changes
git fetch origin
git reset --hard origin/main

# 2. Install dependencies
pnpm install --frozen-lockfile

# 3. Run migrations
pnpm run migration:run

# 4. Build application
pnpm run build

# 5. Restart service
sudo systemctl restart fashly-backend

# 6. Check status
sudo systemctl status fashly-backend
```

### Service Management

```bash
# Start service
sudo systemctl start fashly-backend

# Stop service
sudo systemctl stop fashly-backend

# Restart service
sudo systemctl restart fashly-backend

# Check status
sudo systemctl status fashly-backend

# View logs
sudo journalctl -u fashly-backend -f

# Enable auto-start on boot
sudo systemctl enable fashly-backend
```

---

## 🔧 Environment Configuration

### Production Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-secure-password
DB_NAME=fashly

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-s3-bucket-name

# Application Configuration
NODE_ENV=production
PORT=3000
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Service Won't Start**
```bash
# Check service status
sudo systemctl status fashly-backend

# Check logs
sudo journalctl -u fashly-backend --lines=50

# Check file permissions
ls -la /opt/fashly-backend
```

#### 2. **Database Connection Issues**
```bash
# Test PostgreSQL connection
sudo -u postgres psql -c "SELECT version();"

# Check if fashly database exists
sudo -u postgres psql -l | grep fashly

# Create database if missing
sudo -u postgres createdb fashly
```

#### 3. **Migration Errors**
```bash
# Check migration status
cd /opt/fashly-backend
pnpm run migration:show

# Run migrations manually
pnpm run migration:run

# Revert last migration if needed
pnpm run migration:revert
```

#### 4. **Port Already in Use**
```bash
# Check what's using port 3000
sudo netstat -tlnp | grep 3000

# Kill process if needed
sudo kill -9 <PID>
```

#### 5. **Permission Issues**
```bash
# Fix ownership
sudo chown -R fashly:fashly /opt/fashly-backend

# Fix permissions
sudo chmod +x /opt/fashly-backend/scripts/*.sh
```

### Health Checks

```bash
# API health check
curl http://localhost:3000

# Service health
sudo systemctl is-active fashly-backend

# Database health
pnpm run migration:show

# Logs
sudo journalctl -u fashly-backend --since "1 hour ago"
```

---

## 📊 Monitoring

### Log Management

```bash
# Real-time logs
sudo journalctl -u fashly-backend -f

# Logs from last hour
sudo journalctl -u fashly-backend --since "1 hour ago"

# Logs with priority (errors only)
sudo journalctl -u fashly-backend -p err

# Export logs
sudo journalctl -u fashly-backend > fashly-backend.log
```

### Performance Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🔄 Rolling Back

### Quick Rollback

```bash
# Stop service
sudo systemctl stop fashly-backend

# Checkout previous commit
cd /opt/fashly-backend
git log --oneline -10  # Find commit to rollback to
git reset --hard <commit-hash>

# Rebuild and restart
pnpm install --frozen-lockfile
pnpm run build
sudo systemctl start fashly-backend
```

### Migration Rollback

```bash
# Revert last migration
pnpm run migration:revert

# Check migration status
pnpm run migration:show
```

---

## 🚀 Advanced Deployment

### Using PM2 (Alternative to systemd)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/main.js --name fashly-backend

# Setup auto-restart on boot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

### Using Docker

```bash
# Build image
docker build -t fashly-backend .

# Run container
docker run -d \
  --name fashly-backend \
  -p 3000:3000 \
  --env-file .env \
  fashly-backend
```

### Load Balancer Setup (Nginx)

```nginx
# /etc/nginx/sites-available/fashly-backend
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

This guide provides comprehensive deployment options for the Fashly Backend API! 🎉
