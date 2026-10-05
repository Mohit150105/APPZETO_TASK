import mongoose from 'mongoose';
import { config } from './env';

export const connectDB = async (uri?: string): Promise<typeof mongoose> => {
  const mongoUri = uri || config.mongodbUri;
  try {
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true, // Build compound indexes
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected');
  } catch (error) {
    console.error('[MongoDB] Disconnection error:', error);
  }
};
