# Quick Setup Guide - Authentication API

## 🚀 Docker Setup (Fastest Way)

### 1. Clone and Configure
```bash
git clone <repository-url>
cd demo-integration
cp env.docker.example .env
```

### 2. Start Everything
```bash
docker-compose up -d
```

### 3. Test the API

**Check API health:**
```bash
curl -X GET http://localhost:3000/
```

**Register a user:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "test123456"
  }'
```

**Login with the user:**
```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**Get user profile (copy token from login response):**
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🌐 Access Points

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **pgAdmin**: http://localhost:5050 (admin@example.com / admin)

## 📱 Using Swagger UI

1. Go to http://localhost:3000/api/docs
2. **Test endpoints**:
   - Use `/auth/signup` to create a user
   - Use `/auth/signin` to get a JWT token
   - Copy the `access_token`
   - Click "Authorize" button at top
   - Enter: `Bearer your-token-here`
   - Use `/auth/profile` to get user details

## 🛑 Stop Services
```bash
docker-compose down
```

## 🔧 Troubleshooting

**Services not starting?**
```bash
docker-compose logs
```

**Database issues?**
```bash
docker-compose restart db
```

**Need to rebuild?**
```bash
docker-compose up --build
```

## 📋 What You Get

- ✅ User registration and login
- ✅ JWT token authentication
- ✅ PostgreSQL database
- ✅ Swagger API documentation
- ✅ Docker containerization
- ✅ Production-ready setup

That's it! Your authentication API is ready! 🔐