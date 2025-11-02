import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from '../lib/cloudinary.js'

// Signup a new user
export const signup = async (req, res) => {

    const { fullName, email, password, bio } = req.body;
    try {
        if (!fullName || !email || !password || !bio) {
            return res.json({ success: false, message: "Missing Details" });
        }
        const user = await User.findOne({ email });
        if (user) {
            return res.json({ success: false, message: "Account already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        })

        const token = generateToken(newUser._id)

        res.json({ success: true, userData: newUser, token, message: "Account created successfully." })
    } catch (error) {
        console.log(error.message);
        res.send({ success: false, message: error.message })
    }
};

// Successful signup response 
// {
//   "success": true,
//   "userData": {
//     "_id": "67265b62e8a7a723c874b2d9",
//     "fullName": "Harshal Jain",
//     "email": "harshal@mail.com",
//     "bio": "Full-stack developer learning chat apps.",
//     "profilePic": "",
//     "createdAt": "2025-11-02T13:45:00.000Z",
//     "updatedAt": "2025-11-02T13:45:00.000Z",
//     "__v": 0
//   },
//   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//   "message": "Account created successfully."
// }



// Controller to login a user 
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email })

        const isPasswordCorrect = await bcrypt.compare(password, userData.password)

        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const token = generateToken(userData._id)

        res.json({ success: true, userData, token, message: "Login successful" })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// Successful login response
// {
//   "success": true,
//   "userData": {
//     "_id": "67265b62e8a7a723c874b2d9",
//     "fullName": "Harshal Jain",
//     "email": "harshal@mail.com",
//     "bio": "Full-stack developer learning chat apps.",
//     "profilePic": "https://res.cloudinary.com/demo/image/upload/v1234567890/harshal.png",
//     "createdAt": "2025-11-02T13:45:00.000Z",
//     "updatedAt": "2025-11-02T13:45:00.000Z",
//     "__v": 0
//   },
//   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//   "message": "Login successful"
// }


// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({ success: true, user: req.user })
}
// successful checkauth response
// {
//   "success": true,
//   "user": {
//     "_id": "67265b62e8a7a723c874b2d9",
//     "fullName": "Harshal Jain",
//     "email": "harshal@mail.com",
//     "bio": "Full-stack developer learning chat apps.",
//     "profilePic": "https://res.cloudinary.com/demo/image/upload/v1234567890/harshal.png",
//     "createdAt": "2025-11-02T13:45:00.000Z",
//     "updatedAt": "2025-11-02T13:45:00.000Z"
//   }
// }


// Controller to update user profile details 
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body

        const userId = req.user._id;
        let updatedUser;

        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true })
        } else {
            const upload = await cloudinary.uploader.upload(profilePic)

            updatedUser = await User.findByIdAndUpdate(userId, { profilePic: upload.secure_url, bio, fullName }, { new: true })
        }
        res.json({ success: true, user: updatedUser })
    } catch (error) {
        console.log(error.message)
        res.json({ success: false, message: error.message })
    }
}

// {
//   "success": true,
//   "user": {
//     "_id": "67265b62e8a7a723c874b2d9",
//     "fullName": "Harshal Jain",
//     "email": "harshal@mail.com",
//     "bio": "Building awesome MERN chat apps!",
//     "profilePic": "https://res.cloudinary.com/demo/image/upload/v1730546015/new-profile.png",
//     "createdAt": "2025-11-02T13:45:00.000Z",
//     "updatedAt": "2025-11-02T18:15:00.000Z",
//     "__v": 0
//   }
// }
