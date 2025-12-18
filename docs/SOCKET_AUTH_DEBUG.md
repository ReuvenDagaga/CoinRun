# 🔍 Socket Authentication Diagnostic Guide

## מה לבדוק כעת

### 1️⃣ בדוק את ה-Console בדפדפן

כשאתה נכנס ל-PvP Lobby, אתה אמור לראות:

```
═══════════════════════════════════════════
[PvP Socket] 🔍 DIAGNOSTIC INFO:
[PvP Socket] Token exists: true
[PvP Socket] Token length: XXX
[PvP Socket] Token preview: eyJhbGciOi...
[PvP Socket] Socket URL: http://localhost:3459
[PvP Socket] Full URL: http://localhost:3459/pvp
═══════════════════════════════════════════
[PvP] Connected: <socket-id>
```

### 2️⃣ בדוק את ה-Server Logs

בטרמינל של ה-server, אתה אמור לראות:

```
[Socket Auth] New connection attempt
[Socket Auth] Token in auth: Present
[Socket Auth] Token in query: Missing
[Socket Auth] Final token: Present
[Socket Auth] Verifying token...
[Socket Auth] Token verified, user ID: <your-user-id>
[Socket Auth] ✅ Authentication successful: <your-username>
PvP socket connected: <socket-id>, User: <your-user-id>
```

## 🐛 תרחישי בעיות אפשריים

### תרחיש 1: Token exists: false
**אם אתה רואה:**
```
[PvP Socket] Token exists: false
```

**פתרון:**
```javascript
// בקונסול של הדפדפן:
localStorage.getItem('token')

// אם null - התנתק והתחבר מחדש:
// 1. לחץ על Logout
// 2. התחבר שוב עם Google
```

### תרחיש 2: Socket URL ריק
**אם אתה רואה:**
```
[PvP Socket] Socket URL:
[PvP Socket] Full URL: /pvp
```

**פתרון:**
```bash
# 1. בדוק ש-.env.local קיים:
cat client/.env.local

# 2. אם לא קיים, צור אותו:
echo "VITE_SOCKET_URL=http://localhost:3459" > client/.env.local

# 3. הפעל מחדש את Vite (חובה!):
cd client
npm run dev
```

### תרחיש 3: Token in auth: Missing
**אם ב-server logs אתה רואה:**
```
[Socket Auth] Token in auth: Missing
[Socket Auth] ⚠️ No token provided - allowing as guest
```

**זה אומר שהטוקן לא הגיע לשרת!**

**פתרון:**
1. בדוק CORS - האם השרת מאפשר את ה-origin של הקליינט
2. בדוק שה-Socket URL נכון
3. בדוק שה-token באמת נשלח (בקונסול של הדפדפן)

### תרחיש 4: Token verification failed
**אם אתה רואה:**
```
[Socket Auth] ❌ Token verification failed
```

**פתרון:**
1. הטוקן לא תקף - התנתק והתחבר מחדש
2. JWT_SECRET בשרת לא תואם למה שיצר את הטוקן

### תרחיש 5: User not found
**אם אתה רואה:**
```
[Socket Auth] ❌ User not found: <user-id>
```

**פתרון:**
המשתמש נמחק מה-DB - התחבר מחדש כדי ליצור משתמש חדש

## 📋 Checklist לבדיקה

- [ ] הרצתי מחדש את Vite dev server (`npm run dev` בתיקיית client)
- [ ] `.env.local` קיים ויש בו `VITE_SOCKET_URL=http://localhost:3459`
- [ ] אני מחובר לאפליקציה (רואה את המטבעות שלי)
- [ ] `localStorage.getItem('token')` מחזיר ערך (לא null)
- [ ] ה-server רץ על port 3459
- [ ] בדקתי את ה-console logs בדפדפן
- [ ] בדקתי את ה-server logs בטרמינל

## 🔧 פקודות לבדיקה מהירה

### בדפדפן (Console):
```javascript
// בדוק טוקן
console.log('Token:', localStorage.getItem('token'))

// בדוק Socket URL
console.log('Socket URL from constants:', CLIENT_CONSTANTS.SOCKET_URL)

// בדוק socket status
console.log('Socket connected:', pvpSocket?.connected)
```

### בטרמינל:
```bash
# בדוק שהשרת רץ
lsof -i :3459

# בדוק environment variables
cat client/.env.local

# הפעל מחדש שרת
cd server && npm run dev

# הפעל מחדש קליינט
cd client && npm run dev
```

## 📞 מה לדווח אם זה לא עובד

העתק את כל ה-output הזה:

1. **מה-Browser Console:**
   ```
   [כל השורות שמתחילות ב-[PvP Socket]]
   ```

2. **מה-Server Logs:**
   ```
   [כל השורות שמתחילות ב-[Socket Auth]]
   ```

3. **Environment:**
   ```bash
   cat client/.env.local
   ```

4. **LocalStorage:**
   ```javascript
   localStorage.getItem('token')?.substring(0, 50)
   ```
