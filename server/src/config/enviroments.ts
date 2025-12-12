import 'dotenv/config';

export const CONFIG = {
    MONGO_URI: process.env.MONGODB_URI || '',
    CLIENT_URL: process.env.CLIENT_URL  || '',
    PORT: process.env.PORT || 4000,
    NODE_ENV: process.env.NODE_ENV || 'development',
}; 
