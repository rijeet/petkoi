# Render Deployment Guide for NestJS Backend

## Overview

This guide explains how to deploy the NestJS backend to Render as a Web Service.

## Prerequisites

1. Render account
2. GitHub repository with your code
3. PostgreSQL database (Neon or Render PostgreSQL)
4. All environment variables ready

## Deployment Steps

### 1. Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository containing your backend

### 2. Configure Build Settings

**Service Details:**
- **Name**: `petkoi-backend` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Root Directory:**
```
backend
```

### 3. Set Environment Variables

In Render dashboard, go to **Environment** tab and add:

#### Required Variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secure random string (at least 32 characters)
- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `GOOGLE_CALLBACK_URL` - `https://your-service.onrender.com/auth/google/callback`
- `FRONTEND_URL` - Your frontend URL (e.g., `https://your-frontend.onrender.com`)
- `NODE_ENV` - `production`
- `PORT` - Usually set automatically by Render (default: 3001)

#### Optional Variables:
- `IMAGEKIT_PUBLIC_KEY` - If using ImageKit
- `IMAGEKIT_PRIVATE_KEY` - If using ImageKit
- `IMAGEKIT_URL_ENDPOINT` - If using ImageKit

### 4. Configure Google OAuth

In Google Cloud Console:
1. Go to **APIs & Services** > **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URI:
   - `https://your-service.onrender.com/auth/google/callback`

### 5. Database Setup

#### Option A: Use Neon PostgreSQL
1. Create a Neon database
2. Copy the connection string
3. Add `?sslmode=require` if needed
4. Set as `DATABASE_URL` in Render

#### Option B: Use Render PostgreSQL
1. Create a PostgreSQL database in Render
2. Use the internal connection string provided
3. Set as `DATABASE_URL` in Render

### 6. Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Install dependencies
   - Run `prisma generate` (via postinstall script)
   - Build the application
   - Start the service

### 7. Verify Deployment

1. Check build logs for any errors
2. Once deployed, visit: `https://your-service.onrender.com/health`
3. Check API docs: `https://your-service.onrender.com/docs/api`

## Troubleshooting

### Build Fails

**Error: "Missing required environment variables"**
- Solution: Set all required environment variables before deploying

**Error: "Prisma Client not found"**
- Solution: Ensure `postinstall` script runs: `"postinstall": "prisma generate"`
- Check build logs to verify Prisma generation

**Error: "Cannot find module"**
- Solution: Check that all dependencies are in `package.json`
- Verify TypeScript compilation succeeds

### Runtime Errors

**Error: "Database connection failed"**
- Solution: 
  - Verify `DATABASE_URL` is correct
  - Check database allows connections from Render IPs
  - Add `?sslmode=require` to connection string if needed

**Error: "Port already in use"**
- Solution: Use `process.env.PORT` (Render sets this automatically)

**Error: "JWT_SECRET is not defined"**
- Solution: Set `JWT_SECRET` in Render environment variables

### OAuth Errors

**Error: "Google OAuth callback failed"**
- Solution:
  - Verify `GOOGLE_CALLBACK_URL` matches your Render URL
  - Check Google Cloud Console redirect URIs
  - Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

## Render-Specific Configuration

### Auto-Deploy
- Render automatically deploys on push to the selected branch
- You can disable this in service settings

### Health Checks
- The app includes a `/health` endpoint
- Render will use this for health monitoring

### Environment Variables
- Set in Render dashboard under **Environment** tab
- Changes require a manual redeploy (or auto-deploy on next push)

### Logs
- View logs in Render dashboard
- Real-time logs available during deployment
- Historical logs available in **Logs** tab

## Performance Tips

1. **Use Render PostgreSQL** for better performance (same network)
2. **Enable Auto-Sleep** (free tier) - service sleeps after 15 min inactivity
3. **Upgrade Plan** for always-on service
4. **Use Environment-Specific Configs** for different environments

## Monitoring

1. **Service Health**: Check Render dashboard
2. **Application Logs**: View in Render dashboard
3. **Error Tracking**: Check logs for error patterns
4. **Performance**: Monitor response times in Render metrics

## Next Steps

After successful deployment:
1. Test all API endpoints
2. Verify OAuth flow works
3. Check database connections
4. Monitor error rates
5. Set up alerts for critical errors

## Support

- Render Documentation: https://render.com/docs
- Render Status: https://status.render.com
- Check application logs in Render dashboard for detailed error messages

