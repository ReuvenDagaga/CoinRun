import { Router } from 'express';
import authRouter from './authRoutes.js';
import upgradeRouter from './upgradeRoutes.js';
import shopRouter from './shopRoutes.js';
import runnerRouter from './runnerRoutes.js';
import missionRouter from './missionRoutes.js';
import achievementRouter from './achievementRoutes.js';
import settingsRouter from './settingsRoutes.js';
import userRouter from './userRoutes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/upgrades', upgradeRouter);
router.use('/shop', shopRouter);
router.use('/runner', runnerRouter);
router.use('/missions', missionRouter);
router.use('/achievements', achievementRouter);
router.use('/settings', settingsRouter);
router.use('/user', userRouter);

export default router;
