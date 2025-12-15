import { Router } from "express";
import { getAchievements } from "src/controllers/achievementController";
import { authMiddleware } from "src/middleware/authMiddleware";

const achievementRouter = Router();

achievementRouter.get('/', authMiddleware, getAchievements);

export default achievementRouter;
