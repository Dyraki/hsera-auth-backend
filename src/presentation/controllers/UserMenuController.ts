import { Request, Response } from 'express';
import { GetUserMenusUseCase } from '../../application/use-cases/GetUserMenusUseCase';
import { PrismaMenuRepository } from '../../infrastructure/database/repositories/PrismaMenuRepository';
import { PrismaUserRepository } from '../../infrastructure/database/repositories/PrismaUserRepository';

export class UserMenuController {
  private static readonly menuRepo = new PrismaMenuRepository();
  private static readonly userRepo = new PrismaUserRepository();
  private static readonly getUserMenusUseCase = new GetUserMenusUseCase(
    UserMenuController.menuRepo,
    UserMenuController.userRepo
  );

  // Return menu tree filtered by user's permissions
  public static async getForUser(req: any, res: Response): Promise<void> {
    try {
      const user = req.user || {};
      const result = await UserMenuController.getUserMenusUseCase.execute({
        userId: user.sub || user.id || '',
        username: user.username || '',
        jenis: user.jenis || '',
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Gagal mengambil menu untuk user.' });
    }
  }
}
