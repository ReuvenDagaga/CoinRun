import 'dotenv/config';

export const CONFIG = {
    MONGO_URI: process.env.MONGODB_URI || '',
    CLIENT_URL: process.env.CLIENT_URL  || '',
    PORT: process.env.PORT || 4000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || '',

}; 



