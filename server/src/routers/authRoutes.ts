import { Router } from "express";
import { getCurrentUser, googleAuth, logout } from "src/controllers/authController";
import { authMiddleware } from "src/middleware/authMiddleware";

const authRouter = Router();

authRouter.post('/google', googleAuth);
authRouter.get('/me', authMiddleware, getCurrentUser);
authRouter.post('/logout', authMiddleware, logout);

export default authRouter;