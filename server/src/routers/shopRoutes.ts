import { Router } from "express";
import { getSkins, buySkin, equipSkin, buyLootbox } from "src/controllers/shopController";
import { authMiddleware, optionalAuthMiddleware } from "src/middleware/authMiddleware";

const shopRouter = Router();

shopRouter.get('/skins', optionalAuthMiddleware, getSkins);
shopRouter.post('/buy/skin', authMiddleware, buySkin);
shopRouter.post('/equip/skin', authMiddleware, equipSkin);
shopRouter.post('/buy/lootbox', authMiddleware, buyLootbox);

export default shopRouter;
