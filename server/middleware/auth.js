import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.headers.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            res.json({
                success: false,
                message: "Unauthrized",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.json({
            success: false,
            message: error.message,
        });
    }
};