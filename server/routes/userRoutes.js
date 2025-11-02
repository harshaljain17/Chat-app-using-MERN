import expres from "express";
import {
    checkAuth,
    login,
    signup,
    updateProfile,
} from "../controllers/userControllers.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = expres.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);

export default userRouter;