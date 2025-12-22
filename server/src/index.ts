import dotenv from 'dotenv';
dotenv.config();

import cookieParser from "cookie-parser";
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import mainRoutes from './routers/mainRoutes.js';
import { setupRunnerSocket } from './socket/Runner/socket.js';
import { setupPvPSocket } from './socket/PvP/socketManager.js';
import { setupChestSocket } from './socket/Chest/chestSocket.js';
import { setupSocketAuth } from './middleware/socketAuthMiddleware.js';
import { connectToMongo, disconnectFromMongo } from './db/db.js';
import { CONFIG } from './config/enviroments.js';
import { LOGGER } from './log/logger.js';
import { corsOptions } from './helpers/cors.js';
import { distributeLeaderboardRewards, getNextResetTime } from './services/leaderboard.service.js';

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
setupPvPSocket(io);
setupChestSocket(io);


// Schedule leaderboard rewards distribution at UTC midnight
const scheduleLeaderboardRewards = () => {
  const scheduleNext = () => {
    const now = new Date();
    const nextReset = getNextResetTime();
    const delay = nextReset.getTime() - now.getTime();

    LOGGER.info(`Next leaderboard reward distribution scheduled in ${Math.floor(delay / 1000 / 60)} minutes`);

    setTimeout(async () => {
      try {
        const result = await distributeLeaderboardRewards();
        if (result.success) {
          LOGGER.info(`Leaderboard rewards distributed to ${result.distributed} players`);
        }
      } catch (error: any) {
        LOGGER.error('Failed to distribute leaderboard rewards: ' + error?.message);
      }
      // Schedule next distribution
      scheduleNext();
    }, delay);
  };

  // Try to distribute on startup (in case server was down during reset)
  distributeLeaderboardRewards().then(result => {
    if (result.success && result.distributed > 0) {
      LOGGER.info(`Startup: Distributed missed leaderboard rewards to ${result.distributed} players`);
    }
  }).catch(err => LOGGER.error('Startup reward distribution failed:', err));

  scheduleNext();
};

const startServer = async () => {
  try {
    await connectToMongo();
    server.listen(CONFIG.PORT);
    LOGGER.info(`Server running on port ${CONFIG.PORT} in ${CONFIG.NODE_ENV} mode`);

    // Start leaderboard reward scheduler
    scheduleLeaderboardRewards();
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