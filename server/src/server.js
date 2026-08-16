import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { initSocket } from './socket/socketHandler.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { seedDatabase } from './seed/seedData.js';
import { User } from './models/User.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import postRoutes from './routes/postRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Root Welcome & Health Check API
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'NexusHub API Server',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'NexusHub MERN Server is healthy and running',
    timestamp: new Date(),
  });
});

// Seed API endpoint for instant UI reset
app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.status(200).json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket Event Handlers
initSocket(io);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start Server and Connect Database
const startServer = async () => {
  const conn = await connectDB();
  if (conn) {
    // Check if initial users exist, if not auto-seed
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('\x1b[36mℹ Database is empty. Running initial demo seed...\x1b[0m');
        await seedDatabase();
      }
    } catch (e) {
      console.warn('Initial seed check error:', e.message);
    }
  }

  server.listen(PORT, () => {
    console.log(`\n\x1b[35m==================================================\x1b[0m`);
    console.log(`\x1b[32m🚀 NexusHub Server running on http://localhost:${PORT}\x1b[0m`);
    console.log(`\x1b[34m⚡ WebSocket Server listening for real-time events\x1b[0m`);
    console.log(`\x1b[35m==================================================\n\x1b[0m`);
  });
};

startServer();
