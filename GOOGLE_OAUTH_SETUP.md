# Google OAuth Setup Guide

## Error: redirect_uri_mismatch

This error occurs when the redirect URI in your Google Cloud Console doesn't match the one your application is using.

---

## 🔧 Step-by-Step Fix

### Step 1: Determine Your Callback URL

Your backend callback URL should be:
- **Development**: `http://localhost:3001/auth/google/callback`
- **Production**: `https://your-backend-domain.com/auth/google/callback`

### Step 2: Add Redirect URI in Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project (or create a new one)

2. **Navigate to OAuth Credentials**
   - Go to **APIs & Services** → **Credentials**
   - Or directly: https://console.cloud.google.com/apis/credentials

3. **Edit Your OAuth 2.0 Client**
   - Find your OAuth 2.0 Client ID (the one you're using)
   - Click the **pencil icon** (Edit) or click on the client name

4. **Add Authorized Redirect URIs**
   - Scroll down to **Authorized redirect URIs**
   - Click **+ ADD URI**
   - Add these URIs (one per line):
     ```
     http://localhost:3001/auth/google/callback
     ```
   - For production, also add:
     ```
     https://your-backend-domain.com/auth/google/callback
     ```

5. **Save Changes**
   - Click **SAVE** at the bottom
   - Wait a few seconds for changes to propagate

---

## 📝 Environment Variables

Make sure your `backend/.env` has:

```env
# Backend URL (for building full callback URL)
BACKEND_URL="http://localhost:3001"
# OR for production:
# BACKEND_URL="https://your-backend-domain.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="/auth/google/callback"  # Optional, defaults to this
```

---

## 🔍 Verify Your Setup

### Check Backend Logs

When you start your backend, you should see the callback URL being used. Check the console output or add logging.

### Test the Flow

1. Start your backend: `cd backend && npm run dev`
2. Visit: `http://localhost:3001/auth/google`
3. You should be redirected to Google sign-in
4. After signing in, you should be redirected back to: `http://localhost:3001/auth/google/callback`
5. Then redirected to frontend: `http://localhost:3000/auth/callback?token=...`

---

## ⚠️ Common Mistakes

1. **Missing `http://` or `https://`**
   - ❌ Wrong: `localhost:3001/auth/google/callback`
   - ✅ Correct: `http://localhost:3001/auth/google/callback`

2. **Wrong Port**
   - Make sure the port matches your backend PORT (default: 3001)

3. **Trailing Slash**
   - ❌ Wrong: `http://localhost:3001/auth/google/callback/`
   - ✅ Correct: `http://localhost:3001/auth/google/callback`

4. **Using Frontend URL Instead of Backend**
   - ❌ Wrong: `http://localhost:3000/auth/google/callback`
   - ✅ Correct: `http://localhost:3001/auth/google/callback`

---

## 🚀 Quick Checklist

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Redirect URI added: `http://localhost:3001/auth/google/callback`
- [ ] `GOOGLE_CLIENT_ID` in `backend/.env`
- [ ] `GOOGLE_CLIENT_SECRET` in `backend/.env`
- [ ] `BACKEND_URL` in `backend/.env` (optional, defaults to localhost:3001)
- [ ] Backend restarted after env changes
- [ ] Tested the auth flow

---

## 📚 Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

---

## 🆘 Still Having Issues?

1. **Clear browser cache** - Sometimes cached redirects cause issues
2. **Check browser console** - Look for any JavaScript errors
3. **Check backend logs** - See what callback URL is being used
4. **Verify environment variables** - Make sure they're loaded correctly
5. **Wait a few minutes** - Google changes can take time to propagate

---

**After making changes in Google Cloud Console, wait 1-2 minutes before testing again!**

