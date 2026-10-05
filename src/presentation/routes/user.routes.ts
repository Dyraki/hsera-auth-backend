import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { AclMiddleware } from '../middlewares/AclMiddleware';
import { SYSTEM_MENU_IDS } from '../../domain/constants/MenuConstants';

const router = Router();

// User & Role-User Management Routes (Protected by Menu: ROLE USER)
router.get('/', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_USER, 1), UserController.getAll);
router.get('/:id', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_USER, 1), UserController.getById);
router.post('/', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_USER, 2), UserController.create);
router.put('/:id', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_USER, 3), UserController.update);
router.delete('/:id', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_USER, 4), UserController.delete);

// Role assignment per user
router.get('/:id/roles', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_USER, 1), UserController.getUserRoles);
router.put('/:id/roles', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_USER, 2), UserController.assignRoles);

export default router;
