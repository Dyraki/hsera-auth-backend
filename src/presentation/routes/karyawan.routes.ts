import { Router } from 'express';
import { KaryawanController } from '../controllers/KaryawanController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { AclMiddleware } from '../middlewares/AclMiddleware';
import { SYSTEM_MENU_IDS } from '../../domain/constants/MenuConstants';

const router = Router();

// Subordinates Route
router.get(
  '/:id/subordinates',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.KARYAWAN, 1),
  KaryawanController.getSubordinates
);

// CRUD Master Karyawan
router.get(
  '/',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.KARYAWAN, 1),
  KaryawanController.getAll
);

router.get(
  '/:id',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.KARYAWAN, 1),
  KaryawanController.getById
);

router.post(
  '/',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.KARYAWAN, 2),
  KaryawanController.create
);

router.put(
  '/:id',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.KARYAWAN, 3),
  KaryawanController.update
);

router.delete(
  '/:id',
  AuthMiddleware,
  AclMiddleware(SYSTEM_MENU_IDS.KARYAWAN, 4),
  KaryawanController.delete
);

export default router;
