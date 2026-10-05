import { Router } from 'express';
import { MenuController } from '../controllers/MenuController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { AclMiddleware } from '../middlewares/AclMiddleware';
import { SYSTEM_MENU_IDS } from '../../domain/constants/MenuConstants';

const router = Router();

// Menu Management Routes (Protected by Auth and ACL level checks for Menu/Pengaturan)
router.get('/', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.SETTINGS, 1), MenuController.getAll);
router.get('/:id', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.SETTINGS, 1), MenuController.getById);
router.post('/', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.SETTINGS, 2), MenuController.create);
router.put('/:id', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.SETTINGS, 3), MenuController.update);
router.delete('/:id', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.SETTINGS, 4), MenuController.delete);

export default router;
