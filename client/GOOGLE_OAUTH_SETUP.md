# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the CoinRun application.

## Prerequisites

- Google Cloud Console account
- Node.js and npm installed

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application** as the application type
6. Configure the OAuth consent screen if prompted:
   - User Type: External
   - App name: CoinRun
   - User support email: your email
   - Developer contact: your email
7. Add authorized JavaScript origins:
   - `http://localhost:3000` (Vite dev server port)
   - Your production domain (when deploying)
8. Add authorized redirect URIs:
   - `http://localhost:3000` (Vite dev server port)
   - Your production domain (when deploying)
9. Click **Create**
10. Copy the **Client ID**

## Step 2: Configure Environment Variables

1. In the `client` directory, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Google Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   VITE_API_URL=http://localhost:3000/api
   ```

## Step 3: Backend Configuration

The backend also needs to be configured with the Google Client ID:

1. In the `server` directory, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `server/.env` and add the SAME Google Client ID:
   ```env
   PORT=4000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/coinrun
   CLIENT_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   JWT_SECRET=your-secret-key
   ```

3. Install Google Auth Library on the server:
   ```bash
   cd server
   npm install google-auth-library
   ```

**CRITICAL:** The `GOOGLE_CLIENT_ID` must be identical in both client and server `.env` files!

## Step 4: Install Dependencies

Frontend:
```bash
cd client
npm install
```

Backend:
```bash
cd server
npm install
```

## Step 5: Run the Application

Start the backend server (port 4000):
```bash
cd server
npm run dev
```

Start the frontend dev server (port 3000):
```bash
cd client
npm run dev
```

Navigate to: `http://localhost:3000`

## How It Works

1. User clicks "Sign in with Google" button
2. Google OAuth popup appears
3. User signs in with their Google account
4. Google returns a credential (JWT token)
5. Frontend sends the credential to backend API (`/api/auth/google`)
6. Backend verifies the credential with Google
7. Backend creates or retrieves user account
8. Backend returns user data and auth token
9. Frontend stores auth info and redirects to home page

## Backend API Requirements

Your backend must implement the `/api/auth/google` endpoint:

```typescript
POST /api/auth/google
Content-Type: application/json

{
  "credential": "google-jwt-token-here"
}

Response:
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "username": "username",
    "name": "Full Name",
    "picture": "https://..."
  },
  "userData": {
    // Game-specific user data
    "coins": 1000,
    "gems": 50,
    // ... other game data
  },
  "token": "your-backend-jwt-token",
  "isNewUser": true/false
}
```

## Security Notes

- Never commit `.env` file to version control
- The `.env` file is already in `.gitignore`
- Keep your Google Client ID secure
- Use HTTPS in production
- Implement proper token validation on backend

## Troubleshooting

### "The given origin is not allowed for the given client ID" (403 Error)

**This is your current error!**

**Cause:** Your Google OAuth credentials don't allow `http://localhost:3000`

**Fix:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Services > Credentials
2. Click on your OAuth 2.0 Client ID (`777188711541-hgc4qmbd29j8quqhsdv846grjsudusq0`)
3. Under **Authorized JavaScript origins**, click "ADD URI" and add:
   - `http://localhost:3000`
4. Under **Authorized redirect URIs**, ensure you have:
   - `http://localhost:3000`
5. Click **Save**
6. Wait 5 minutes for changes to propagate
7. Restart both frontend and backend servers
8. Clear browser cache and try again

### "POST http://localhost:4000/api/auth/google 404" Error

**Cause:** Backend server not running or environment variables not set

**Fix:**
1. Make sure backend server is running: `cd server && npm run dev`
2. Verify `server/.env` file exists with `GOOGLE_CLIENT_ID`
3. Check that `google-auth-library` is installed: `cd server && npm install`
4. Restart backend server after adding environment variables

### "Unexpected token '<', '<!DOCTYPE'... is not valid JSON"

**Cause:** Backend returning HTML error page instead of JSON (usually 404)

**Fix:**
1. Verify backend is running on port 4000
2. Check backend logs for errors
3. Ensure MongoDB is running: `brew services start mongodb-community` (Mac)
4. Verify all environment variables are set correctly

### "Invalid OAuth client ID"
- Make sure you copied the full Client ID (ends with `.apps.googleusercontent.com`)
- Verify `VITE_GOOGLE_CLIENT_ID` in `client/.env` matches Google Cloud Console
- Restart frontend dev server after changing `.env`

### Google button not appearing
- Check browser console for errors
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly in `client/.env`
- Make sure you ran `npm install` in the client directory
- Restart frontend dev server

## Production Deployment

When deploying to production:

1. Add your production domain to Google Cloud Console:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com`

2. Update `.env` for production:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_API_URL=https://yourdomain.com/api
   ```

3. Use environment variables in your hosting platform (Vercel, Netlify, etc.)
