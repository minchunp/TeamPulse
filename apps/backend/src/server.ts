import { app } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { connectRedis } from "./config/redis";

/**
 * Boots the Web Server by connecting to external services (DB, Cache)
 * and starts listening for HTTP requests on the configured port.
 */
const startServer = async (): Promise<void> => {
   try {
      console.log("⏳ Starting TeamPulse Backend Services...");

      // Connect to MongoDB
      await connectDB();

      // Connect to Redis
      await connectRedis();

      // Start listening
      const PORT = env.PORT || 5001;
      app.listen(PORT, () => {
         console.log(`✔ [Server]: TeamPulse backend is running successfully.`);
         console.log(`✔ [Server]: Local Access: http://localhost:${PORT}`);
         console.log(`✔ [Server]: Environment: ${env.NODE_ENV}`);
      });
   } catch (error) {
      console.error("❌ [Server Initialization Error]: Failed to bootstrap backend:", error);
      process.exit(1);
   }
};

// Fire up the server
startServer();
