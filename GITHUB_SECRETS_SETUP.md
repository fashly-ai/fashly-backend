# GitHub Secrets Setup Guide

This guide explains how to set up GitHub repository secrets for automated deployment of the Fashly Backend API.

## 📋 Required Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 🗄️ Database Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DB_HOST` | Database hostname | `localhost` or `your-db-server.com` |
| `DB_PORT` | Database port | `5432` (default PostgreSQL port) |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `your-secure-password` |
| `DB_NAME` | Database name | `fashly` |

### 🔐 JWT Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key-256-bits-long` |
| `JWT_EXPIRATION` | JWT token expiration | `24h` (optional, defaults to 24h) |

### ☁️ AWS S3 Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `your-secret-access-key` |
| `AWS_S3_BUCKET` | S3 bucket name | `your-bucket-name` |

### 🖥️ Server Deployment Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SERVER_HOST` | Server hostname/IP | `your-server.com` or `192.168.1.100` |
| `SERVER_USER` | SSH username | `deploy` or `ubuntu` |
| `SERVER_SSH_KEY` | Private SSH key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH port | `22` (optional, defaults to 22) |
| `APP_DIRECTORY` | App directory path | `/opt/fashly-backend` |

### ⚙️ Application Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `NODE_ENV` | Node environment | `production` (optional, defaults to production) |
| `PORT` | Application port | `3000` (optional, defaults to 3000) |

## 🔧 Setting Up Secrets

### 1. Database Setup

```bash
# If using local PostgreSQL on server
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-secure-password
DB_NAME=fashly

# If using remote database (e.g., AWS RDS)
DB_HOST=your-db.cluster-xyz.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=fashly_user
DB_PASSWORD=your-secure-password
DB_NAME=fashly
```

### 2. JWT Configuration

```bash
# Generate a secure JWT secret (256 bits recommended)
# You can use: openssl rand -base64 32
JWT_SECRET=YourSuperSecretJWTKey256BitsLongForMaximumSecurity
JWT_EXPIRATION=24h
```

### 3. AWS S3 Setup

First, create an IAM user with S3 permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name"
        }
    ]
}
```

Then add the credentials:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
```

### 4. Server SSH Setup

Generate SSH key pair on your local machine:

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_key

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_actions_key.pub user@your-server.com

# Add private key content to GitHub secrets
cat ~/.ssh/github_actions_key
```

Server secrets:

```bash
SERVER_HOST=your-server.com
SERVER_USER=deploy
SERVER_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(paste entire private key content here)
-----END OPENSSH PRIVATE KEY-----
SERVER_PORT=22
APP_DIRECTORY=/opt/fashly-backend
```

## 🚀 Deployment Workflows

### Automatic Deployment

Once secrets are set up, deployments work automatically:

```bash
# Push to main branch triggers deployment
git push origin main
```

### Manual Deployment

Go to **Actions** tab → **Deploy to Server** → **Run workflow**

## 🔒 Security Best Practices

### 1. **Rotate Secrets Regularly**
```bash
# Update secrets every 90 days
# Generate new JWT secrets
# Rotate AWS access keys
# Update database passwords
```

### 2. **Use Least Privilege**
```bash
# AWS IAM: Only grant S3 permissions needed
# Database: Use dedicated user with limited permissions
# Server: Use non-root deployment user
```

### 3. **Monitor Access**
```bash
# Enable GitHub audit logs
# Monitor AWS CloudTrail
# Check server access logs
```

### 4. **Environment Separation**
```bash
# Use different secrets for different environments
# staging-* secrets for staging environment
# production-* secrets for production
```

## 🧪 Testing Secrets

### Validate Database Connection

```bash
# Test database connection on server
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -c "SELECT version();"
```

### Validate AWS S3 Access

```bash
# Test AWS credentials
aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
aws configure set region $AWS_REGION
aws s3 ls s3://$AWS_S3_BUCKET
```

### Test SSH Access

```bash
# Test SSH connection
ssh -i ~/.ssh/github_actions_key $SERVER_USER@$SERVER_HOST "echo 'SSH connection successful'"
```

## 📝 Environment File Structure

The GitHub Action creates this `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-secure-password
DB_NAME=fashly

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=24h

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Application Configuration
NODE_ENV=production
PORT=3000
```

## 🔍 Troubleshooting

### Common Issues

1. **Missing secrets**: Check secret names match exactly
2. **Database connection**: Verify host, port, credentials
3. **AWS permissions**: Ensure IAM policy allows S3 operations
4. **SSH access**: Verify key format and server access

### Debug Deployment

```bash
# Check GitHub Actions logs
# Go to Actions tab → Latest workflow run → View logs

# Check server logs
sudo journalctl -u fashly-backend -f

# Test environment variables
cd /opt/fashly-backend
cat .env  # Verify file was created correctly
```

This setup ensures secure, automated deployment with all sensitive data properly managed through GitHub secrets! 🔐
