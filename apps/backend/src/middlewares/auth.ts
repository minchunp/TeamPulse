import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { redisClient } from "../config/redis";

// Interface representing the user object stored in the JWT payload
export interface IAuthUser {
   id: string;
   email?: string;
   name: string;
}

// Module augmentation to extend the global Express User interface
declare global {
   namespace Express {
      interface User extends IAuthUser {}
   }
}

// In-memory fallback blacklist when Redis is offline or disconnected
const tokenBlacklistFallback = new Set<string>();

/**
 * Adds a token to the blacklist (both in Redis and In-Memory fallback).
 * This will be called during the logout flow.
 *
 * @param token The JWT token to blacklist
 * @param ttlSeconds Time to live in seconds
 */
export const blacklistToken = async (token: string, ttlSeconds: number): Promise<void> => {
   // Always add to fallback Set to ensure consistency
   tokenBlacklistFallback.add(token);

   // Automatically clean up from in-memory fallback after TTL
   setTimeout(() => {
      tokenBlacklistFallback.delete(token);
   }, ttlSeconds * 1000);

   if (redisClient.isOpen) {
      try {
         // Store in Redis with TTL
         await redisClient.set(`blacklist:${token}`, "true", { EX: ttlSeconds });
      } catch (error) {
         console.error("❌ [Redis Blacklist Error]: Failed to add token to Redis:", error);
      }
   }
};

/**
 * Checks if a token has been blacklisted.
 *
 * @param token The JWT token to verify
 * @returns boolean indicating if the token is blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
   if (redisClient.isOpen) {
      try {
         const isBlacklisted = await redisClient.get(`blacklist:${token}`);
         return isBlacklisted !== null;
      } catch (error) {
         console.error("❌ [Redis Blacklist Error]: Failed to check token in Redis, falling back to local memory:", error);
      }
   }
   return tokenBlacklistFallback.has(token);
};

/**
 * Middleware to protect private routes.
 * Decodes the JWT and assigns its payload directly to req.user for performance optimization (zero DB hits).
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
   try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
         res.status(401).json({ message: "Authentication required. No token provided." });
         return;
      }

      const token = authHeader.split(" ")[1];

      // 1. Check if token is blacklisted (logged out)
      const blacklisted = await isTokenBlacklisted(token);
      if (blacklisted) {
         res.status(401).json({ message: "Token is invalid or has been logged out." });
         return;
      }

      // 2. Verify JWT Access Token signature and expiration
      let decoded: any;
      try {
         decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      } catch (err) {
         res.status(401).json({ message: "Token is invalid or has expired." });
         return;
      }

      if (!decoded || !decoded.id) {
         res.status(401).json({ message: "Invalid token payload." });
         return;
      }

      // 3. Assign basic payload details directly to req.user (optimization to avoid Mongoose queries on every route)
      req.user = {
         id: decoded.id,
         email: decoded.email,
         name: decoded.name,
      };

      next();
   } catch (error) {
      console.error("❌ [Auth Middleware Error]:", error);
      res.status(500).json({ message: "Internal server error during authentication." });
   }
};
