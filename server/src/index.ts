import dotenv from 'dotenv';
dotenv.config();

import cookieParser from "cookie-parser";
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import mainRoutes from './routers/mainRoutes.js';
import { setupRunnerSocket } from './socket/Runner/socket.js';
import { setupSocketAuth } from './middleware/socketAuthMiddleware.js';
import { connectToMongo, disconnectFromMongo } from './db/db.js';
import { CONFIG } from './config/enviroments.js';
import { LOGGER } from './log/logger.js';
import { corsOptions } from './helpers/cors.js';

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/api', mainRoutes);

setupSocketAuth(io);
setupRunnerSocket(io);


const startServer = async () => {
  try {
    await connectToMongo();
    server.listen(CONFIG.PORT);
    LOGGER.info(`Server running on port ${CONFIG.PORT} in ${CONFIG.NODE_ENV} mode`);
  } catch (error) {
    LOGGER.error('Failed to start server:' + error);
    process.exit(1);
  }
}

const shutdown = async () => {
  LOGGER.info('Shutting down...');
  server.close(async () => {
    await disconnectFromMongo();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

export { io };