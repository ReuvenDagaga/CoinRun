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
   - `http://localhost:5173` (for development)
   - Your production domain (when deploying)
8. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
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

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run the Application

```bash
npm run dev
```

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

### "Invalid OAuth client ID"
- Make sure you copied the full Client ID
- Check that your domain is in authorized JavaScript origins

### "Redirect URI mismatch"
- Add `http://localhost:5173` to authorized redirect URIs
- Make sure there are no trailing slashes

### Google button not appearing
- Check browser console for errors
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
- Make sure you ran `npm install`

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
