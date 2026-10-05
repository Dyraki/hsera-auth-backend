import { Router } from 'express';
import authRoutes from './auth.routes';
import menuRoutes from './menu.routes';
import userMenuRoutes from './user-menu.routes';
import roleRoutes from './role.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import operationUnitRoutes from './operation-unit.routes';
import karyawanRoutes from './karyawan.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/menus', menuRoutes);
apiRouter.use('/user/menus', userMenuRoutes);
apiRouter.use('/roles', roleRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/operation-units', operationUnitRoutes);
apiRouter.use('/karyawan', karyawanRoutes);

export default apiRouter;
