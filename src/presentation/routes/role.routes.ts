import { Router } from 'express';
import { RoleController } from '../controllers/RoleController';
import { RoleAclController } from '../controllers/RoleAclController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { AclMiddleware } from '../middlewares/AclMiddleware';
import { SYSTEM_MENU_IDS } from '../../domain/constants/MenuConstants';

const router = Router();

// Template ACL (harus didefinisikan sebelum /:id agar tidak tertangkap sebagai parameter)
router.get('/acls/template', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_MANAGEMENT, 1), RoleAclController.getTemplate);

// Role CRUD Routes (Protected by Auth and ACL checks for Role Management)
router.get('/', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_MANAGEMENT, 1), RoleController.getAll);
router.get('/:id', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_MANAGEMENT, 1), RoleController.getById);
router.post('/', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_MANAGEMENT, 2), RoleController.create);
router.put('/:id', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_MANAGEMENT, 3), RoleController.update);
router.delete('/:id', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_MANAGEMENT, 4), RoleController.delete);

// Role ACL Management per Role ID
router.get('/:id/acls', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_MANAGEMENT, 1), RoleAclController.getForRole);
router.put('/:id/acls', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.ROLE_MANAGEMENT, 2), RoleAclController.updateForRole);

export default router;
