import { Router } from "express";
import { startSoloGame, finishSoloGame, getLeaderboard, getPlayerStats } from "src/controllers/runnerController";
import { authMiddleware, optionalAuthMiddleware } from "src/middleware/authMiddleware";

const runnerRouter = Router();

runnerRouter.post('/solo', authMiddleware, startSoloGame);
runnerRouter.post('/solo/finish', authMiddleware, finishSoloGame);
runnerRouter.get('/leaderboard', optionalAuthMiddleware, getLeaderboard);
runnerRouter.get('/stats', authMiddleware, getPlayerStats);

export default runnerRouter;
