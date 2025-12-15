import { Router } from "express";
import { updateUser } from "src/controllers/userController";
import { authMiddleware } from "src/middleware/authMiddleware";

const userRouter = Router();

userRouter.put('/update', authMiddleware, updateUser);

export default userRouter;
