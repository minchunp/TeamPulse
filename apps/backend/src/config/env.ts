import dotenv from "dotenv";
import path from "path";

// Load .env file from the backend folder root using relative path to prevent issues in Monorepo setups
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export interface EnvConfig {
   PORT: number;
   NODE_ENV: "development" | "production" | "test";
   MONGO_URI: string;
   REDIS_URL: string;
   JWT_ACCESS_SECRET: string;
   JWT_REFRESH_SECRET: string;
   FRONTEND_URL: string;
   GOOGLE_CLIENT_ID: string;
   GOOGLE_CLIENT_SECRET: string;
   GOOGLE_CALLBACK_URL: string;
   GITHUB_CLIENT_ID: string;
   GITHUB_CLIENT_SECRET: string;
   GITHUB_CALLBACK_URL: string;
}

/**
 * Retrieves environment variable or throws an explicit error if missing.
 */
const getEnvOrThrow = (key: string): string => {
   const value = process.env[key];
   if (!value || value.trim() === "") {
      throw new Error(`[Env Validation Error]: Missing or empty required environment variable "${key}". Please check your .env file.`);
   }
   return value;
};

/**
 * Retrieves environment variable or returns the default value.
 */
const getEnvOrDefault = (key: string, defaultValue: string): string => {
   return process.env[key] || defaultValue;
};

// Validate and parse variables
const rawPort = getEnvOrDefault("PORT", "5001");
const PORT = parseInt(rawPort, 10);
if (isNaN(PORT)) {
   throw new Error(`[Env Validation Error]: PORT environment variable "${rawPort}" is not a valid number.`);
}

const NODE_ENV = getEnvOrDefault("NODE_ENV", "development") as "development" | "production" | "test";
if (!["development", "production", "test"].includes(NODE_ENV)) {
   throw new Error(`[Env Validation Error]: NODE_ENV must be "development", "production", or "test". Received: "${NODE_ENV}"`);
}

export const env: EnvConfig = {
   PORT,
   NODE_ENV,
   MONGO_URI: getEnvOrThrow("MONGO_URI"),
   REDIS_URL: getEnvOrThrow("REDIS_URL"),
   JWT_ACCESS_SECRET: getEnvOrThrow("JWT_ACCESS_SECRET"),
   JWT_REFRESH_SECRET: getEnvOrThrow("JWT_REFRESH_SECRET"),
   FRONTEND_URL: getEnvOrThrow("FRONTEND_URL"),
   GOOGLE_CLIENT_ID: getEnvOrThrow("GOOGLE_CLIENT_ID"),
   GOOGLE_CLIENT_SECRET: getEnvOrThrow("GOOGLE_CLIENT_SECRET"),
   GOOGLE_CALLBACK_URL: getEnvOrThrow("GOOGLE_CALLBACK_URL"),
   GITHUB_CLIENT_ID: getEnvOrThrow("GITHUB_CLIENT_ID"),
   GITHUB_CLIENT_SECRET: getEnvOrThrow("GITHUB_CLIENT_SECRET"),
   GITHUB_CALLBACK_URL: getEnvOrThrow("GITHUB_CALLBACK_URL"),
};
