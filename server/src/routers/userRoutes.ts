import { Router } from "express";
import { getMe, updateUser } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const userRouter = Router();

userRouter.get('/me', authMiddleware, getMe);
userRouter.put('/update', authMiddleware, updateUser);

export default userRouter;
