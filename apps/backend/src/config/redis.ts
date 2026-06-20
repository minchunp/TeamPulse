import { createClient } from "redis";
import { env } from "./env";

// Create a v4 redis client using URL from environment
export const redisClient = createClient({
   url: env.REDIS_URL,
});

redisClient.on("connect", () => {
   console.log("✔ [Redis]: Connecting...");
});

redisClient.on("ready", () => {
   console.log("✔ [Redis]: Connected and ready to use.");
});

redisClient.on("error", (err) => {
   console.error("❌ [Redis]: Client error:", err);
});

redisClient.on("end", () => {
   console.warn("⚠️ [Redis]: Connection closed.");
});

/**
 * Connects to the Redis cache server safely.
 */
export const connectRedis = async (): Promise<void> => {
   try {
      if (!redisClient.isOpen) {
         await redisClient.connect();
      }
   } catch (error) {
      console.error("❌ [Redis]: Failed to establish connection:", error);
   }
};
