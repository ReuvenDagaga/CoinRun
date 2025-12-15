import { Router } from "express";
import { getUpgrades, purchaseUpgrade } from "src/controllers/upgradeController";
import { authMiddleware } from "src/middleware/authMiddleware";

const upgradeRouter = Router();

upgradeRouter.get('/', authMiddleware, getUpgrades);
upgradeRouter.post('/:type', authMiddleware, purchaseUpgrade);

export default upgradeRouter;
