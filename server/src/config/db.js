import mongoose from "mongoose";
import env from "./env.js";

export default async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log(
    `MongoDB connected✅👍🏻: ${mongoose.connection.host}/${mongoose.connection.name}`,
  );
}
