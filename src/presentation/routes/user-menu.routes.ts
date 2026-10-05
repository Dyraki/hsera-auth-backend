import { Router } from 'express';
import { UserMenuController } from '../controllers/UserMenuController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

const router = Router();

// Menus untuk sidebar navigasi per-user
router.get('/', AuthMiddleware, UserMenuController.getForUser);

export default router;
