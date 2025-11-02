import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, userSocketMap } from "../server.js";

// This controller fetches all users except the currently logged-in user — perfect for showing the user list in your sidebar.
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;      // req.user is the current logged in as well as authenticated user we will take all the users not matching logged in users id from db to display on the sidebar
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select(           // array of user objects (MongoDB documents).
            "-password"
        );

        // Count number of messages not seen
        const unseenMessages = {};
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({
                senderId: user._id,                  // divyanshu
                receiverId: userId,                  // harshal
                seen: false,                         // unread
            });
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        });

        await Promise.all(promises);                  // waits for all those async database queries to finish before continuing.
        res.json({ success: true, users: filteredUsers, unseenMessages });

    } catch (error) {

        console.log(error.message);
        exports.json({ success: false, message: error.message });

    }
};
// sample successful response
// {
//   "success": true,
//   "users": [
//     {
//       "_id": "67266b0dbe832930a065b3d5",
//       "fullName": "Divyanshu Sharma",
//       "email": "divyanshu@mail.com",
//       "bio": "Tech enthusiast",
//       "profilePic": "https://res.cloudinary.com/demo/image/upload/v1730546015/divyanshu.png"
//     },
//     {
//       "_id": "67266b5fbe832930a065b3e0",
//       "fullName": "Aditi Singh",
//       "email": "aditi@mail.com",
//       "bio": "UI/UX designer",
//       "profilePic": ""
//     }
//   ],
//   "unseenMessages": {
//     "67266b0dbe832930a065b3d5": 3
//   }
// }


// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ],
        });

        await Message.updateMany(                          // divyanshu ne jo msgs bheje h hume unhe seen krdo kyuki humne khol liya h
            { senderId: selectedUserId, receiverId: myId },
            { seen: true }
        );

        res.json({ success: true, messages });

    } catch (error) {

        console.log(error.message);
        res.json({ success: false, message: error.message });

    }
};

// sample success response
// {
//   "success": true,
//   "messages": [
//     {
//       "_id": "67266db6be832930a065b4a1",
//       "senderId": "67266b0dbe832930a065b3d5",
//       "receiverId": "67265b62e8a7a723c874b2d9",
//       "text": "Hey, how are you?",
//       "image": null,
//       "seen": true,
//       "createdAt": "2025-11-02T12:30:14.123Z"
//     },
//     {
//       "_id": "67266dcfbe832930a065b4a4",
//       "senderId": "67265b62e8a7a723c874b2d9",
//       "receiverId": "67266b0dbe832930a065b3d5",
//       "text": "I’m good, what about you?",
//       "image": null,
//       "seen": false,
//       "createdAt": "2025-11-02T12:31:00.987Z"
//     }
//   ]
// }



// This is for individual message updates, often triggered:
// When a specific message gets delivered to your screen in real time via socket.io, without reloading the chat.
export const markMessageAsSeen = async (req, res) => {
    try {

        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });

        res.json({ success: true });

    } catch (error) {

        console.log(error.message);
        res.json({ success: false, message: error.message });

    }
};


// Send message to selected user
export const sendMessage = async (req, res) => {
    try {

        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;               // cloudinary gives back a secured_url just like mongodb gives _id
        }

        const newMessage = await Message.create({               // creating the Message object in db
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        // Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId]        // maps the default recieverId to a socketId called recieverSocketId

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage)
        }

        res.json({ success: true, newMessage });

    } catch (error) {

        console.log(error.message);
        res.json({ success: false, message: error.message });

    }
};