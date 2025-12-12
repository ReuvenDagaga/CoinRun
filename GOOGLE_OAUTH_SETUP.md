# Google OAuth Setup Instructions

## הבעיה שהייתה
הבעיה העיקרית הייתה שה-origin ב-Google Cloud Console לא היה מוגדר נכון. השרת רץ על port 4000, והקליינט על port 3000, אבל ב-Google Console היה מוגדר http://localhost:3459.

## הגדרת Google Cloud Console - **חשוב מאוד!**

### 1. כנס ל-Google Cloud Console
עבור ל: https://console.cloud.google.com/apis/credentials

### 2. בחר את ה-OAuth Client ID שלך
לחץ על הלקוח שלך (Client ID שמתחיל ב-`777188711541-...`)

### 3. הגדר את Authorized JavaScript origins
**חובה להוסיף:**
- `http://localhost:3000` - זה ה-origin שבו הקליינט רץ

**אופציונלי (למקרה שתרצה להריץ על פורטים אחרים):**
- `http://localhost:5173` - אם אתה משתמש ב-Vite ישירות
- הפורטים האחרים ברשימה שלך נראים קשורים לפרויקטים אחרים

### 4. הגדר את Authorized redirect URIs
**למרות שאנחנו משתמשים ב-client-side OAuth (לא server-side), עדיף להוסיף:**
- `http://localhost:3000/auth/google/callback`
- `http://localhost:4000/api/auth/google/callback`

### 5. שמור את השינויים
לחץ על "Save" בתחתית הדף

## הגדרת הפרויקט

### קבצי .env כבר נוצרו בשבילך:

#### Server (.env)
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-jwt-key
CLIENT_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### Client (.env)
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_API_URL=/api
```

**הערה**: קבצי ה-.env האמיתיים כבר נוצרו בשבילך עם הפרטים הנכונים. זה רק דוגמה למבנה.

## איך זה עובד?

1. **Frontend (port 3000)**:
   - Vite dev server רץ על http://localhost:3000
   - יש proxy ב-vite.config.ts שמעביר `/api` ל-`http://localhost:4000`
   - כשהקוד מבקש `/api/auth/google`, Vite מעביר את זה ל-`http://localhost:4000/api/auth/google`

2. **Backend (port 4000)**:
   - Express server רץ על http://localhost:4000
   - מקבל בקשות מ-http://localhost:3000 (מוגדר ב-CORS)
   - מאמת את ה-Google token ויוצר/מחזיר משתמש

3. **Google OAuth**:
   - צריך לדעת שהאפליקציה רצה על http://localhost:3000
   - לכן חייב להוסיף את זה ל-Authorized JavaScript origins

## הרצת הפרויקט

### Terminal 1 - Backend
```bash
cd server
npm install
npm run dev
```

### Terminal 2 - Frontend
```bash
cd client
npm install
npm run dev
```

## בדיקה שהכל עובד

1. פתח את הדפדפן ב-http://localhost:3000
2. לחץ על Google Sign In
3. אם הכל מוגדר נכון, תראה את חלון ההתחברות של Google
4. אחרי התחברות, תועבר לעמוד הבית

## שגיאות נפוצות

### "The given origin is not allowed for the given client ID"
- **פתרון**: ודא שהוספת `http://localhost:3000` ל-Authorized JavaScript origins ב-Google Cloud Console

### "ERR_CONNECTION_REFUSED to localhost:4000"
- **פתרון**: ודא שהשרת רץ על port 4000
- בדוק שיש לך `.env` בתיקיית server עם `PORT=4000`

### "Failed to fetch"
- **פתרון**: ודא שגם הקליינט וגם השרת רצים
- בדוק שה-CORS מוגדר נכון (כבר מוגדר ב-allowOrigins.ts)

## הערות אבטחה

⚠️ **חשוב**: קבצי .env מכילים מידע רגיש (סודות, סיסמאות למסד נתונים)
- אל תעלה אותם ל-Git
- הם כבר ב-.gitignore
- בסביבת production, השתמש במשתני סביבה של ה-hosting provider
