import { Router, Request, Response } from 'express';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registers a new user (Email/Password)
 * @access  Public
 */
router.post('/register', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Mock Register Endpoint. Registration successful.',
    data: {
      userId: 'mock_user_id_123',
      name: req.body.name || 'Mock User',
      email: req.body.email || 'mock@teampulse.com',
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Logs in a user (Email/Password) and sets HttpOnly Refresh Token cookie
 * @access  Public
 */
router.post('/login', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Mock Login Endpoint. Login successful.',
    accessToken: 'mock_access_token_jwt_xxxxx',
    user: {
      id: 'mock_user_id_123',
      email: req.body.email || 'mock@teampulse.com',
      name: 'Mock User',
    },
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logs out a user and blacklists the token
 * @access  Public
 */
router.post('/logout', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Mock Logout Endpoint. Logout successful and cookie cleared.',
  });
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Reads refresh token cookie, validates it, and issues a new access token
 * @access  Public
 */
router.post('/refresh', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Mock Refresh Token Endpoint. New access token issued.',
    accessToken: 'mock_new_access_token_jwt_yyyyy',
  });
});

/**
 * @route   GET /api/auth/google
 * @desc    Initiates Google OAuth flow
 * @access  Public
 */
router.get('/google', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Mock Google OAuth flow initiated. Redirecting to Google Login page...',
  });
});

/**
 * @route   GET /api/auth/github
 * @desc    Initiates GitHub OAuth flow
 * @access  Public
 */
router.get('/github', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Mock GitHub OAuth flow initiated. Redirecting to GitHub Login page...',
  });
});

export const authRouter = router;
