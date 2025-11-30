# 🚀 Quick Start Guide - Pet Identity Platform

This guide will help you get the Pet Identity Platform up and running on your local machine.

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **PostgreSQL** database (or [Neon](https://neon.tech) account for cloud database)
- **Git** (for cloning the repository)

### Optional (but recommended):

- **Redis** (for caching - optional)
- **ImageKit** account (for image uploads)
- **Google Cloud Console** account (for OAuth)

---

## 📦 Step 1: Install Dependencies

### Option A: Install from Root (Recommended for Monorepo)

```bash
# From the root directory
npm run install:all
```

This will install dependencies for both backend and frontend.

### Option B: Install Separately

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 🔐 Step 2: Set Up Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
```

Create `backend/.env` with the following content:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/pet_platform?schema=public"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="/auth/google/callback"

# ImageKit Configuration
IMAGEKIT_PUBLIC_KEY="public_your-imagekit-public-key"
IMAGEKIT_PRIVATE_KEY="private_your-imagekit-private-key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-imagekit-id/"

# Frontend Configuration
FRONTEND_URL="http://localhost:3000"
```

**Important:** Replace all placeholder values with your actual credentials!

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
cd ../frontend
```

Create `frontend/.env.local` with the following content:

```env
# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-change-this-in-production"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Note:** The `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` should be the same as in the backend `.env` file.

---

## 🗄️ Step 3: Set Up Database

### Option A: Using Local PostgreSQL

1. **Create a PostgreSQL database:**

   ```bash
   # Using psql
   createdb pet_platform

   # Or using SQL
   psql -U postgres
   CREATE DATABASE pet_platform;
   ```
2. **Update `DATABASE_URL` in `backend/.env`:**

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/pet_platform?schema=public"
   ```

### Option B: Using Neon (Cloud Database)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Update `DATABASE_URL` in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```

### Generate Prisma Client and Run Migrations

```bash
cd backend

# Generate Prisma Client
npm run prisma:generate
# or
npx prisma generate

# Run database migrations
npm run prisma:migrate
# or
npx prisma migrate dev --name init
```

This will:

- Generate the Prisma Client
- Create all database tables
- Set up relationships and indexes

---

## 🏃 Step 4: Run the Project

### Option A: Run from Root (Two Terminal Windows)

**Terminal 1 - Backend:**

```bash
# From root directory
npm run dev:backend
```

**Terminal 2 - Frontend:**

```bash
# From root directory
npm run dev:frontend
```

### Option B: Run Separately

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

### Expected Output

**Backend should show:**

```
Application is running on: http://localhost:3001
Swagger documentation available at: http://localhost:3001/docs/api
```

**Frontend should show:**

```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- Local:        http://localhost:3000
```

---

## ✅ Step 5: Verify Installation

### 1. Check Backend Health

Open your browser and visit:

- **Health Check:** http://localhost:3001/health
- **API Documentation:** http://localhost:3001/docs/api

You should see:

- Health endpoint returns `{"status":"ok"}`
- Swagger UI loads with API documentation

### 2. Check Frontend

Open your browser and visit:

- **Frontend:** http://localhost:3000

You should see the Pet Identity Platform homepage.

### 3. Test Database Connection

```bash
cd backend
npm run prisma:studio
```

This opens Prisma Studio at http://localhost:5555 where you can view and edit your database.

---

## 🔧 Troubleshooting

### Backend won't start

1. **Check if port 3001 is available:**

   ```bash
   # Windows
   netstat -ano | findstr :3001

   # Mac/Linux
   lsof -i :3001
   ```
2. **Check database connection:**

   - Verify `DATABASE_URL` is correct
   - Ensure PostgreSQL is running
   - Test connection: `psql $DATABASE_URL`
3. **Check environment variables:**

   - Ensure `.env` file exists in `backend/` directory
   - Verify all required variables are set

### Frontend won't start

1. **Check if port 3000 is available:**

   ```bash
   # Windows
   netstat -ano | findstr :3000

   # Mac/Linux
   lsof -i :3000
   ```
2. **Check environment variables:**

   - Ensure `.env.local` file exists in `frontend/` directory
   - Verify `NEXT_PUBLIC_API_URL` points to backend URL

### Database migration errors

1. **Reset database (⚠️ WARNING: This deletes all data):**

   ```bash
   cd backend
   npx prisma migrate reset
   ```
2. **Check Prisma schema:**

   ```bash
   npx prisma validate
   ```

### Common Issues

**Issue:** `Module not found` errors

- **Solution:** Run `npm install` in the affected directory

**Issue:** `Prisma Client not generated`

- **Solution:** Run `npx prisma generate` in `backend/` directory

**Issue:** `JWT_SECRET` or `NEXTAUTH_SECRET` errors

- **Solution:** Generate a strong secret:
  ```bash
  # Using OpenSSL
  openssl rand -base64 32
  ```

---

## 📚 Next Steps

### 1. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI:
   - Backend: `http://localhost:3001/auth/google/callback`
   - Frontend: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to both `.env` files

### 2. Set Up ImageKit

1. Sign up at [ImageKit](https://imagekit.io)
2. Get your credentials from the dashboard:
   - Public Key
   - Private Key
   - URL Endpoint
3. Add to `backend/.env`

### 3. Explore the API

Visit http://localhost:3001/docs/api to explore:

- All available endpoints
- Request/response schemas
- Try out API calls directly from Swagger UI

### 4. Run Tests

```bash
# Backend tests
cd backend
npm run test

# Frontend tests (if configured)
cd frontend
npm run test
```

---

## 🎯 Quick Commands Reference

### Backend Commands

```bash
cd backend

npm run dev          # Start development server
npm run build        # Build for production
npm run start:prod   # Run production build
npm run test         # Run tests
npm run test:cov     # Run tests with coverage
npm run prisma:studio # Open Prisma Studio
npm run lint         # Lint code
```

### Frontend Commands

```bash
cd frontend

npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Lint code
```

### Root Commands (Monorepo)

```bash
npm run dev:backend   # Start backend
npm run dev:frontend # Start frontend
npm run build        # Build both
npm run lint         # Lint both
npm run install:all  # Install all dependencies
```

---

## 📖 Additional Resources

- **Full Documentation:** See `README.md`
- **Requirements:** See `REQUIREMENTS.md`
- **API Docs:** http://localhost:3001/docs/api (when backend is running)
- **Prisma Studio:** http://localhost:5555 (when running `prisma studio`)

---

## 🆘 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review error messages in the terminal
3. Check that all environment variables are set correctly
4. Verify database connection
5. Ensure all dependencies are installed

---

**Happy Coding! 🐾**
