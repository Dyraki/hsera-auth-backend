import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { AclMiddleware } from '../middlewares/AclMiddleware';
import { SYSTEM_MENU_IDS } from '../../domain/constants/MenuConstants';

const router = Router();

// Rute uji coba ACL (Hanya bisa diakses jika user punya izin untuk menu 'dashboard' dengan min level 1)
router.get('/dashboard', AuthMiddleware, AclMiddleware(SYSTEM_MENU_IDS.DASHBOARD, 1), (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Selamat datang di dashboard admin! Hak akses Anda telah terverifikasi.',
  });
});

export default router;
