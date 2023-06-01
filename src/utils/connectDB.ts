import mongoose from "mongoose";
import config from "config";

const localUri = config.get<string>("dbUri");

console.log("localUri >>>", localUri);

async function connectDB() {
  try {
    await mongoose.connect(localUri);
    console.log("🚀 MongoDB connected successfully");
  } catch (error: any) {
    console.log("🔥 MongoDB connected error: ", error.message);
    // setTimeout(connectDB, 5000);
  }
}

export default connectDB;
