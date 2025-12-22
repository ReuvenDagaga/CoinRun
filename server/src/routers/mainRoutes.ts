import { Router } from 'express';
import authRouter from './authRoutes.js';
import upgradeRouter from './upgradeRoutes.js';
import shopRouter from './shopRoutes.js';
import runnerRouter from './runnerRoutes.js';
import missionRouter from './missionRoutes.js';
import achievementRouter from './achievementRoutes.js';
import settingsRouter from './settingsRoutes.js';
import userRouter from './userRoutes.js';
import assetRouter from './assetRoutes.js';
import cardRouter from './cardRoutes.js';
import chestRouter from './chestRoutes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/upgrades', upgradeRouter);
router.use('/shop', shopRouter);
router.use('/runner', runnerRouter);
router.use('/missions', missionRouter);
router.use('/achievements', achievementRouter);
router.use('/settings', settingsRouter);
router.use('/user', userRouter);
router.use('/assets', assetRouter);
router.use('/cards', cardRouter);
router.use('/chests', chestRouter);

export default router;
