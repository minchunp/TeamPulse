import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import { configurePassport } from "./config/passport";
import { mainRouter } from "./routes";
import { env } from "./config/env";

const app = express();

// 1. Setup Base Middlewares
app.use(
   cors({
      origin: env.FRONTEND_URL || "http://localhost:3000",
      credentials: true, // Enable sending/receiving cookies over CORS
   }),
);

app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 2. Initialize Passport
configurePassport();
app.use(passport.initialize());

// 3. Register Application Routes
app.use("/api", mainRouter);

// 4. Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction): void => {
   console.error("❌ [Global Error Handler]:", err);

   const statusCode = err.statusCode || err.status || 500;
   const message = err.message || "An unexpected internal server error occurred.";

   res.status(statusCode).json({
      status: "error",
      message,
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
   });
});

export { app };
