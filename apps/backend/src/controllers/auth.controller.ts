import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";
import { env } from "../config/env";
import { blacklistToken, isTokenBlacklisted } from "../middlewares/auth";

/**
 * Helper function to generate Access and Refresh Tokens.
 *
 * @param user The user document to sign into tokens
 * @returns Object containing accessToken and refreshToken
 */
const generateTokens = (user: IUser) => {
   const accessToken = jwt.sign(
      {
         id: user._id,
         email: user.email,
         name: user.name,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" },
   );

   const refreshToken = jwt.sign({ id: user._id }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

   return { accessToken, refreshToken };
};

/**
 * Registers a new user with Email and Password.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
   try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
         res.status(400).json({ message: "Name, email, and password are required." });
         return;
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if the user already exists
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
         res.status(400).json({ message: "An account with this email address already exists." });
         return;
      }

      // Create and save new user (pre-save hook hashes the password)
      const user = new User({
         name: name.trim(),
         email: normalizedEmail,
         password,
      });
      await user.save();

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Set Refresh Token in secure HttpOnly Cookie
      res.cookie("refreshToken", refreshToken, {
         httpOnly: true,
         secure: env.NODE_ENV === "production",
         sameSite: "lax",
         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      });

      res.status(201).json({
         message: "User registration completed successfully.",
         accessToken,
         user: {
            id: user._id,
            email: user.email,
            name: user.name,
         },
      });
   } catch (error) {
      console.error("❌ [Register Controller Error]:", error);
      res.status(500).json({ message: "Internal server error during registration." });
   }
};

/**
 * Authenticates a user using email and password.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
   try {
      const { email, password } = req.body;

      if (!email || !password) {
         res.status(400).json({ message: "Email and password are required." });
         return;
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Find the user by email
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
         res.status(401).json({ message: "Invalid email or password." });
         return;
      }

      // Handle case where user registered via Google/GitHub OAuth and has no password set
      if (!user.password) {
         res.status(400).json({
            message: "This account was registered using OAuth. Please sign in with Google or GitHub.",
         });
         return;
      }

      // Verify password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
         res.status(401).json({ message: "Invalid email or password." });
         return;
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Set Refresh Token in secure HttpOnly Cookie
      res.cookie("refreshToken", refreshToken, {
         httpOnly: true,
         secure: env.NODE_ENV === "production",
         sameSite: "lax",
         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      });

      res.status(200).json({
         message: "Login successful.",
         accessToken,
         user: {
            id: user._id,
            email: user.email,
            name: user.name,
         },
      });
   } catch (error) {
      console.error("❌ [Login Controller Error]:", error);
      res.status(500).json({ message: "Internal server error during login." });
   }
};

/**
 * Log out a user, blacklist their Refresh Token, and clear their cookies.
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
   try {
      const { refreshToken } = req.cookies;

      if (refreshToken) {
         // Blacklist the refresh token for the remaining duration of its lifetime (7 days)
         const TTL_7_DAYS_SECONDS = 7 * 24 * 60 * 60;
         await blacklistToken(refreshToken, TTL_7_DAYS_SECONDS);
      }

      // Clear the refreshToken cookie on the client with matching attributes
      res.clearCookie("refreshToken", {
         httpOnly: true,
         secure: env.NODE_ENV === "production",
         sameSite: "lax",
      });

      res.status(200).json({ message: "Logout successful." });
   } catch (error) {
      console.error("❌ [Logout Controller Error]:", error);
      res.status(500).json({ message: "Internal server error during logout." });
   }
};

/**
 * Silent refresh handler: consumes a valid refresh token and issues a new access token.
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
   try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
         res.status(401).json({ message: "Refresh token not found. Please log in again." });
         return;
      }

      // 1. Security check: Verify if the Refresh Token is blacklisted
      const isBlacklisted = await isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
         // Clear the cookie immediately as the token is tainted
         res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
         });
         res.status(401).json({ message: "Token is invalid or has been logged out." });
         return;
      }

      // 2. Verify signature and expiration of the Refresh Token
      let decoded: any;
      try {
         decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      } catch (err) {
         res.status(401).json({ message: "Refresh token has expired or is invalid." });
         return;
      }

      if (!decoded || !decoded.id) {
         res.status(401).json({ message: "Invalid refresh token payload." });
         return;
      }

      // 3. Find the user corresponding to the token ID
      const user = await User.findById(decoded.id);
      if (!user) {
         res.status(401).json({ message: "Associated account not found." });
         return;
      }

      // 4. Generate a new Access Token
      const accessToken = jwt.sign(
         {
            id: user._id,
            email: user.email,
            name: user.name,
         },
         env.JWT_ACCESS_SECRET,
         { expiresIn: "15m" },
      );

      res.status(200).json({
         message: "New access token issued successfully.",
         accessToken,
      });
   } catch (error) {
      console.error("❌ [Refresh Controller Error]:", error);
      res.status(500).json({ message: "Internal server error during token refresh." });
   }
};

/**
 * Handle successful OAuth strategy login, set cookie and redirect to Frontend.
 */
export const oauthSuccessCallback = async (req: Request, res: Response): Promise<void> => {
   try {
      // req.user is set by Passport strategies after successful authentication
      const user = req.user as any;
      if (!user) {
         res.redirect(`${env.FRONTEND_URL}/login?error=AuthenticationFailed`);
         return;
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Set Refresh Token in secure HttpOnly Cookie
      res.cookie("refreshToken", refreshToken, {
         httpOnly: true,
         secure: env.NODE_ENV === "production",
         sameSite: "lax",
         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend callback handler URL with access token in query
      res.redirect(`${env.FRONTEND_URL}/oauth-callback?token=${accessToken}`);
   } catch (error) {
      console.error("❌ [OAuth Callback Controller Error]:", error);
      res.redirect(`${env.FRONTEND_URL}/login?error=ServerError`);
   }
};
