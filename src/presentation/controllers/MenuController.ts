import { Request, Response } from 'express';
import { ManageMenuUseCase } from '../../application/use-cases/ManageMenuUseCase';
import { PrismaMenuRepository } from '../../infrastructure/database/repositories/PrismaMenuRepository';

export class MenuController {
  private static readonly menuRepository = new PrismaMenuRepository();
  private static readonly manageMenuUseCase = new ManageMenuUseCase(MenuController.menuRepository);

  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await MenuController.manageMenuUseCase.getAll();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil data menu.' });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await MenuController.manageMenuUseCase.getById(id);
      if (!result) {
        res.status(404).json({ message: 'Menu tidak ditemukan.' });
        return;
      }
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil detail menu.' });
    }
  }

  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id;
      const result = await MenuController.manageMenuUseCase.create(req.body, userId);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal menyimpan menu.' });
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await MenuController.manageMenuUseCase.update(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal memperbarui menu.' });
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await MenuController.manageMenuUseCase.delete(id);
      res.status(200).json({ message: 'Menu berhasil dihapus.' });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal menghapus menu.' });
    }
  }
}
