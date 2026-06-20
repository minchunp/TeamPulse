import { env } from "../config/env";

/**
 * Script to verify the responsiveness and response structure of the backend server.
 * Connects to the server locally and tests the Healthcheck and Mock Login endpoints.
 */
async function testServer() {
   const BASE_URL = `http://localhost:${env.PORT}`;

   console.log("🚀 [Verify Server]: Starting HTTP integration tests...");
   console.log(`📡 Connecting to target host: ${BASE_URL}\n`);

   // --- Test Case 1: GET /api/health ---
   try {
      console.log("📡 Test Case 1: Sending GET request to /api/health...");

      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.status !== 200) {
         throw new Error(`Expected HTTP 200, received HTTP ${response.status}`);
      }

      const data: any = await response.json();
      console.log("   Received JSON:", JSON.stringify(data, null, 2));

      // Verify fields
      if (data.status !== "ok") {
         throw new Error(`Expected status to be "ok", received: "${data.status}"`);
      }
      if (!data.timestamp || data.uptime === undefined) {
         throw new Error("Response JSON properties missing (timestamp or uptime)");
      }

      console.log("✅ Pass: Healthcheck API is functioning correctly.\n");
   } catch (error: any) {
      console.error("❌ Fail: Healthcheck API verification failed.");
      if (error.code === "ECONNREFUSED") {
         console.error("   Error details: Connection refused. Is the Express server running?");
      } else {
         console.error(`   Error details: ${error.message}`);
      }
      process.exit(1);
   }

   // --- Test Case 2: POST /api/auth/login ---
   try {
      console.log("📡 Test Case 2: Sending POST request to /api/auth/login...");

      const payload = {
         email: "test@teampulse.com",
         password: "password123",
      };

      const response = await fetch(`${BASE_URL}/api/auth/login`, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify(payload),
      });

      if (response.status !== 200) {
         throw new Error(`Expected HTTP 200, received HTTP ${response.status}`);
      }

      const data: any = await response.json();
      console.log("   Received JSON:", JSON.stringify(data, null, 2));

      // Verify fields
      if (!data.accessToken || !data.user || data.user.email !== payload.email) {
         throw new Error("Response JSON properties missing or incorrect (accessToken, user or email)");
      }

      console.log("✅ Pass: Mock Login API is functioning correctly.\n");
   } catch (error: any) {
      console.error("❌ Fail: Mock Login API verification failed.");
      console.error(`   Error details: ${error.message}`);
      process.exit(1);
   }

   console.log("⭐ [Verification Success]: All HTTP API endpoints are functional and verified!");
   process.exit(0);
}

// Execute tests
testServer().catch((error) => {
   console.error("💥 Fatal error during verification:", error);
   process.exit(1);
});
