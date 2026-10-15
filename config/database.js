import mongoose from "mongoose";

export const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    'mongodb://dev:devpassword@mongo:27017/devdb?authSource=admin';

  await mongoose.connect(uri);
  console.log("MongoDB connected successfully");
};
