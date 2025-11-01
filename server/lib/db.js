import mongoose from "mongoose";

// Function to connect to mongoDB database
export const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => (console.log("MongoDB Connected!!")))
        await mongoose.connect(`${process.env.MONGODB_URI}/quick-chat`)
    } catch (error) {
        console.log(error)
    }
}
