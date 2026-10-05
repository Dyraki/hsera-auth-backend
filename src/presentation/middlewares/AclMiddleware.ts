import { Response, NextFunction } from 'express';
import { hasPermissionAction } from '../../domain/utils/PermissionUtils';

export const AclMiddleware = (menuId: string, minLevel: number) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Akses ditolak. Autentikasi diperlukan.' });
    }

    // Super user bypass (admin & SA automatically have full access)
    if (user.username === 'admin' || user.jenis === 'SA' || user.jenis === 'admin') {
      return next();
    }

    if (!user.permissions) {
      return res.status(403).json({ message: 'Akses ditolak. Klaim izin tidak ditemukan.' });
    }

    // Cari izin akses menu khusus via string UUID
    const permission = user.permissions.find((p: any) => String(p.menuId) === String(menuId));

    if (!permission || !permission.enable) {
      return res.status(403).json({ message: 'Akses ditolak. Menu tidak aktif untuk Anda.' });
    }

    if (!hasPermissionAction(permission.level, minLevel)) {
      return res.status(403).json({ message: 'Akses ditolak. Tingkat otorisasi tidak mencukupi.' });
    }

    next();
  };
};
