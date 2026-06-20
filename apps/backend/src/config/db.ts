import mongoose from "mongoose";
import { env } from "./env";

/**
 * Establishes connection to the MongoDB database and registers lifecycle event listeners.
 */
export const connectDB = async (): Promise<void> => {
   try {
      mongoose.connection.on("connected", () => {
         console.log("✔ [MongoDB]: Connected to database successfully.");
      });

      mongoose.connection.on("error", (err) => {
         console.error("❌ [MongoDB]: Connection error:", err);
      });

      mongoose.connection.on("disconnected", () => {
         console.warn("⚠️ [MongoDB]: Disconnected from database.");
      });

      await mongoose.connect(env.MONGO_URI);
   } catch (error) {
      console.error("❌ [MongoDB]: Failed to establish connection:", error);
      process.exit(1);
   }
};
