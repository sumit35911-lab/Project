import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexushub';
  
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`\x1b[32m✔ MongoDB Connected Successfully: ${conn.connection.host}/${conn.connection.name}\x1b[0m`);
    return conn;
  } catch (error) {
    console.error(`\x1b[31m✖ MongoDB Connection Error: ${error.message}\x1b[0m`);
    console.warn(`\x1b[33m💡 Make sure your MongoDB instance is running at ${mongoUri} or update MONGO_URI in server/.env\x1b[0m`);
    // Do not terminate process immediately in dev mode, allow manual retry
    return null;
  }
};
