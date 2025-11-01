import User from "../models/user.model.js"
import jwt from "jsonwebtoken"

// the frontend req first talks to this middleware then goes to authCheck controller
// Middleware to protect routes
export const protectRoute = async (req, res, next) => {
    try {

        const token = req.headers.token        // headers tell backend extra info about the req like metadata

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).select(
            "-password"
        )

        if (!user) return res.json({ success: false, message: "User not found" })

        req.user = user
        next()

    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}
