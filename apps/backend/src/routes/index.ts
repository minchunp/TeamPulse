import { Router } from 'express';
import { authRouter } from './auth.routes';

const router = Router();

/**
 * Healthcheck route to monitor application readiness and basic info.
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Map auth endpoints to /auth prefix
router.use('/auth', authRouter);

export const mainRouter = router;
