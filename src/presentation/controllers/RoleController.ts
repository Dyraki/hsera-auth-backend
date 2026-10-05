import { Request, Response } from 'express';
import { ManageRoleUseCase } from '../../application/use-cases/ManageRoleUseCase';
import { PrismaRoleRepository } from '../../infrastructure/database/repositories/PrismaRoleRepository';

export class RoleController {
  private static readonly roleRepository = new PrismaRoleRepository();
  private static readonly manageRoleUseCase = new ManageRoleUseCase(RoleController.roleRepository);

  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await RoleController.manageRoleUseCase.getAll();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil data role.' });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await RoleController.manageRoleUseCase.getById(id);
      if (!result) {
        res.status(404).json({ message: 'Role tidak ditemukan.' });
        return;
      }
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil detail role.' });
    }
  }

  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await RoleController.manageRoleUseCase.create(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal menyimpan role.' });
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await RoleController.manageRoleUseCase.update(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal memperbarui role.' });
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await RoleController.manageRoleUseCase.delete(id);
      res.status(200).json({ message: 'Role berhasil dihapus.' });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal menghapus role.' });
    }
  }
}
