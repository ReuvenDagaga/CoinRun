# PvP Setup Guide

## Environment Setup

The PvP system requires proper socket configuration to connect the client to the server.

### 1. Configure Environment Variables

Create or update `/client/.env.local` with:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

**Important**: After adding/changing environment variables, you MUST restart the Vite dev server for changes to take effect.

### 2. Restart Development Servers

```bash
# In one terminal - Server
cd server
npm run dev

# In another terminal - Client
cd client
npm run dev
```

### 3. Verify Socket Connection

When you navigate to the PvP lobby, check the browser console for:

```
[PvP Socket] Initializing with token: Present
[PvP Socket] Socket URL: http://localhost:3000
[PvP] Connected: <socket-id>
```

If you see "Token: Missing", you need to log in again.
If you see "Socket URL: " (empty), the environment variable wasn't loaded.

### 4. Test Authentication

1. Log in to the app
2. Click the 1v1 button
3. Check the server console - you should see:
   ```
   PvP socket connected: <socket-id>, User: <your-user-id>
   ```
   NOT "User: guest"

### Troubleshooting

**Issue**: Server shows "User: guest"
- **Solution**: Make sure you're logged in and the token is in localStorage
- Check browser console: `localStorage.getItem('token')`

**Issue**: Socket doesn't connect
- **Solution**: Verify VITE_SOCKET_URL is set and dev server was restarted
- Check that server is running on port 3000

**Issue**: "CORS error"
- **Solution**: Server's CORS configuration should allow the client origin
- Check `server/src/helpers/cors.ts`

**Issue**: Auth middleware not working
- **Solution**: Check that `setupSocketAuth(io)` is called in server/src/index.ts
- Verify token is valid: check server logs for "Invalid token" errors

## How Authentication Works

1. User logs in via Google OAuth
2. Server returns JWT token
3. Client stores token in localStorage (key: "token")
4. Client creates socket connection with token in auth payload
5. Server's socket middleware verifies token and attaches user to socket
6. All socket events can access authenticated user via `socket.user`

## Database Migration

If you're upgrading from an earlier version, run this MongoDB command to add the `heldCoins` field to existing users:

```javascript
db.users.updateMany({}, { $set: { heldCoins: 0 } })
```

## Next Steps

Once authentication is working:
1. Test matchmaking with 2 browser tabs
2. Verify coin holds are placed/released correctly
3. Play a complete match end-to-end
4. Check that rewards are distributed properly
