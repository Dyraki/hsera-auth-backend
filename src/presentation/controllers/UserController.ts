import { Request, Response } from 'express';
import { ManageUserUseCase } from '../../application/use-cases/ManageUserUseCase';
import { PrismaUserRepository } from '../../infrastructure/database/repositories/PrismaUserRepository';
import { LegacyHasher } from '../../infrastructure/security/LegacyHasher';

export class UserController {
  private static readonly userRepository = new PrismaUserRepository();
  private static readonly passwordHasher = new LegacyHasher();
  private static readonly manageUserUseCase = new ManageUserUseCase(
    UserController.userRepository,
    UserController.passwordHasher
  );

  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await UserController.manageUserUseCase.getAll();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil data pengguna.' });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await UserController.manageUserUseCase.getById(id);
      if (!result) {
        res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        return;
      }
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil detail pengguna.' });
    }
  }

  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const result = await UserController.manageUserUseCase.create(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal membuat pengguna.' });
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await UserController.manageUserUseCase.update(id, req.body);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal memperbarui pengguna.' });
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await UserController.manageUserUseCase.delete(id);
      res.status(200).json({ message: 'Pengguna berhasil dihapus.' });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal menghapus pengguna.' });
    }
  }

  public static async getUserRoles(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await UserController.manageUserUseCase.getUserRoles(id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil role pengguna.' });
    }
  }

  public static async assignRoles(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { roleIds } = req.body;
      await UserController.manageUserUseCase.assignRoles(id, roleIds || []);
      res.status(200).json({ message: 'Role pengguna berhasil diperbarui.' });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal memperbarui role pengguna.' });
    }
  }
}
