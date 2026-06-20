import { Router } from "express";
import passport from "passport";
import { register, login, logout, refresh, oauthSuccessCallback } from "../controllers/auth.controller";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registers a new user (Email/Password)
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/login
 * @desc    Logs in a user (Email/Password) and sets HttpOnly Refresh Token cookie
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logs out a user and blacklists the token
 * @access  Public
 */
router.post("/logout", logout);

/**
 * @route   POST /api/auth/refresh
 * @desc    Reads refresh token cookie, validates it, and issues a new access token
 * @access  Public
 */
router.post("/refresh", refresh);

/**
 * @route   GET /api/auth/google
 * @desc    Initiates Google OAuth flow
 * @access  Public
 */
router.get(
   "/google",
   passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
   }),
);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth Callback handler redirection
 * @access  Public
 */
router.get(
   "/google/callback",
   passport.authenticate("google", {
      session: false,
      failureRedirect: "/api/auth/login-fail", // Handled or redirected if failure occurs
   }),
   oauthSuccessCallback,
);

/**
 * @route   GET /api/auth/github
 * @desc    Initiates GitHub OAuth flow
 * @access  Public
 */
router.get(
   "/github",
   passport.authenticate("github", {
      scope: ["user:email"],
      session: false,
   }),
);

/**
 * @route   GET /api/auth/github/callback
 * @desc    GitHub OAuth Callback handler redirection
 * @access  Public
 */
router.get(
   "/github/callback",
   passport.authenticate("github", {
      session: false,
      failureRedirect: "/api/auth/login-fail",
   }),
   oauthSuccessCallback,
);

/**
 * Route fallback for OAuth strategy failures
 */
router.get("/login-fail", (req, res) => {
   res.status(401).json({
      message: "OAuth Authentication failed. Please check your credentials or try again.",
   });
});

export const authRouter = router;
