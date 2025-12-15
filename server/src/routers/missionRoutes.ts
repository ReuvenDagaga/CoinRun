import { Router } from "express";
import { getMissions, claimMission } from "src/controllers/missionController";
import { authMiddleware } from "src/middleware/authMiddleware";

const missionRouter = Router();

missionRouter.get('/', authMiddleware, getMissions);
missionRouter.post('/claim', authMiddleware, claimMission);

export default missionRouter;
