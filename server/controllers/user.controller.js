import mongoose from "mongoose";
import User from "../models/user.model.js";
import { generateToken } from "../lib/utils.js";
import cloudinary from '../lib/cloudinary.js'
import bcrypt from 'bcryptjs'

// Controller to signup new user
export const signup = async (req, res) => {

    console.log("Signup body:", req.body);

    const { fullName, email, password, bio } = req.body

    try {

        if (!fullName || !email || !password || !bio) {
            return res.json({ success: false, message: "Missing Details" })
        }

        const user = await User.findOne({ email })
        if (user) {
            return res.json({ success: false, message: "Account already exists" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        })

        const token = generateToken(newUser._id)

        res.json({ succes: true, userData: newUser, token, message: "Account created succesfully" })

    } catch (error) {

        console.log(error.message)
        res.json({ success: false, message: error.message, })

    }
}

// Controller to login new user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.json({ success: false, message: "Invalid password" });
        }

        // Generate token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({
            success: true,
            message: "Login successful",
            token,
            userData: user,
        });
    } catch (error) {
        console.error("Login error:", error);
        res
            .status(500)
            .json({ success: false, message: error.message || "Server error" });
    }
};

// Controller to check if user is authenticated
export const checkAuth = async (req, res) => {                 // frontend --> middleware(auth.js) --> checkAuth controller
    res.json({ success: true, user: req.user })                // we are returning user model i.e. user details to frontend from here in a object called user
}

// Controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id;

        let updatedUser;

        if (!profilePic) {
            // No new image, just update text fields
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { bio, fullName },
                { new: true }
            );
        } else {
            // Upload new image to Cloudinary
            const upload = await cloudinary.uploader.upload(profilePic);

            // Update user with image + bio + name
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { profilePic: upload.secure_url, bio, fullName },
                { new: true }
            );
        }

        res.json({ success: true, user: updatedUser });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};


