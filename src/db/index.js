import mongoose from "mongoose";

const connnectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("Mongo db connection error", error)
        process.exit(1)
    }
}

export default connnectDB