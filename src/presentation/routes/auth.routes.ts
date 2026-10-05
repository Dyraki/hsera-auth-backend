import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { loginRateLimiter } from '../middlewares/RateLimitMiddleware';

const router = Router();

// Public Routes
router.post('/login', loginRateLimiter, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// Protected Routes (Session & Profile)
router.get('/profile', AuthMiddleware, AuthController.profile);
router.get('/sessions', AuthMiddleware, AuthController.getSessions);
router.delete('/sessions/:sessionId', AuthMiddleware, AuthController.revokeSession);
router.post('/logout-all', AuthMiddleware, AuthController.logoutAll);

export default router;
