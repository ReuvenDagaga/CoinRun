import { Router } from "express";
import { getSettings, updateSettings } from "src/controllers/settingsController";
import { authMiddleware } from "src/middleware/authMiddleware";

const settingsRouter = Router();

settingsRouter.get('/', authMiddleware, getSettings);
settingsRouter.put('/', authMiddleware, updateSettings);

export default settingsRouter;
