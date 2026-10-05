import { Router } from 'express';
import { OperationUnitController } from '../controllers/OperationUnitController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { AclMiddleware } from '../middlewares/AclMiddleware';
import { SYSTEM_MENU_IDS } from '../../domain/constants/MenuConstants';

const router = Router();

// Endpoint Pohon Hierarki Unit
router.get(
  '/tree',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.OPERATION_UNIT, 1),
  OperationUnitController.getTree
);

// CRUD Operation Unit
router.get(
  '/',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.OPERATION_UNIT, 1),
  OperationUnitController.getAll
);

router.get(
  '/:id',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.OPERATION_UNIT, 1),
  OperationUnitController.getById
);

router.post(
  '/',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.OPERATION_UNIT, 2),
  OperationUnitController.create
);

router.put(
  '/:id',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.OPERATION_UNIT, 3),
  OperationUnitController.update
);

router.delete(
  '/:id',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.OPERATION_UNIT, 4),
  OperationUnitController.delete
);

export default router;
