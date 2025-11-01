import Message from "../models/message.model.js"
import User from "../models/user.model.js"
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";

// Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {

        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
            "-password"
        );

        // count no of messages not seen
        const unseenMessages = {};
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({
                senderId: user._id,
                receiverId: userId,
                seen: false,
            });

            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        });

        await Promise.all(promises);
        res.json({
            success: true,
            users: filteredUsers,
            unseenMessages,
        });

    } catch (error) {

        console.log(error.message);
        res.json({
            success: false,
            message: error.message,
        });

    }
};

// Fetch all messages between A and B (both directions)
// Mark B → A messages as seen (because A just opened the chat)
// Send them all back to the frontend
export const getMessages = async (req, res) => {
    try {

        const { id: selectedUserId } = req.params;
        const myId = req.user._id

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
        });

        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId },
            { seen: true }
        );

        res.json({
            success: true,
            messages,
        })

    } catch (error) {

        console.log(error.messages)
        res.json({ success: false, message: filteredUsers, unseenMessages })

    }
}

// When the frontend receives a new message in real time, it calls this API to mark only that message as seen.
export const markMessageAsSeen = async (req, res) => {

    try {

        const { id } = req.params
        await Message.findByIdAndUpdate(id, { seen: true })
        return res.json({ success: true });

    } catch (error) {

        console.log(error.message);
        res.json({ success: false, message: error.message }); f

    }
}

export const sendMessage = async (req, res) => {

    try {

        const { text, image } = req.body;
        const senderId = req.user._id;
        const receiverId = req.params.id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        })

        // Send message in real-time (via Socket.io)
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        return res.json({
            success: true,
            newMessage,
        });

    } catch (error) {

        console.log(error.message);
        res.json({
            success: false,
            message: error.message,
        });
    }
}
