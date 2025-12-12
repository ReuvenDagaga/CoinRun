import mongoose from 'mongoose';
import { CONFIG } from '../config/enviroments';
import { LOGGER } from '../log/logger';



export const connectToMongo = async (): Promise<void> => {
  try {
    await mongoose.connect(CONFIG.MONGO_URI);
    LOGGER.info('[DB] Connected to MongoDB');
  } catch (error) {
    throw LOGGER.error('[DB] Connection failed:' + error);
  }
};

export const disconnectFromMongo = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    LOGGER.info('[DB] Disconnected from MongoDB');
  } catch (error) {
    throw LOGGER.error('[DB] Disconnection failed:' + error);}
};
