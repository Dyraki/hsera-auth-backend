import { Request, Response } from 'express';
import { ManageKaryawanUseCase } from '../../application/use-cases/ManageKaryawanUseCase';
import { PrismaKaryawanRepository } from '../../infrastructure/database/repositories/PrismaKaryawanRepository';
import { PrismaOperationUnitRepository } from '../../infrastructure/database/repositories/PrismaOperationUnitRepository';

export class KaryawanController {
  private static readonly karyawanRepo = new PrismaKaryawanRepository();
  private static readonly ouRepo = new PrismaOperationUnitRepository();
  private static readonly useCase = new ManageKaryawanUseCase(
    KaryawanController.karyawanRepo,
    KaryawanController.ouRepo
  );

  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { page, limit, search, operationUnitId, status } = req.query;

      const isSuperAdmin = user?.jenis === 'SA' || user?.username === 'admin';
      const allowedUnitIds = user?.scope?.allowedUnitIds || [];

      const params: any = {
        page: page ? parseInt(String(page), 10) : 1,
        limit: limit ? parseInt(String(limit), 10) : 10,
        search: search ? String(search) : undefined,
        operationUnitId: operationUnitId ? String(operationUnitId) : undefined,
        status: status !== undefined ? (status === 'true' || status === '1') : undefined
      };

      const result = await KaryawanController.useCase.getAll(params, {
        isSuperAdmin,
        allowedUnitIds
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil data karyawan.' });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await KaryawanController.useCase.getById(id);
      res.status(200).json({
        ...result.karyawan,
        lineage: result.lineage
      });
    } catch (error: any) {
      res.status(404).json({ message: error.message || 'Karyawan tidak ditemukan.' });
    }
  }

  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || null;
      const karyawan = await KaryawanController.useCase.create({
        ...req.body,
        createdBy: userId
      });
      res.status(201).json(karyawan.props);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal menyimpan data karyawan.' });
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.sub || (req as any).user?.id || null;
      const karyawan = await KaryawanController.useCase.update(id, {
        ...req.body,
        updatedBy: userId
      });
      res.status(200).json(karyawan.props);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal memperbarui data karyawan.' });
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await KaryawanController.useCase.delete(id);
      res.status(200).json({ message: 'Karyawan berhasil dihapus.' });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal menghapus karyawan.' });
    }
  }

  public static async getSubordinates(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const subordinates = await KaryawanController.useCase.getSubordinates(id);
      res.status(200).json(subordinates.map(s => s.props));
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil staf bawahan.' });
    }
  }
}
