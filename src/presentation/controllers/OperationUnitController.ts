import { Request, Response } from 'express';
import { ManageOperationUnitUseCase } from '../../application/use-cases/ManageOperationUnitUseCase';
import { PrismaOperationUnitRepository } from '../../infrastructure/database/repositories/PrismaOperationUnitRepository';

export class OperationUnitController {
  private static readonly ouRepo = new PrismaOperationUnitRepository();
  private static readonly useCase = new ManageOperationUnitUseCase(OperationUnitController.ouRepo);

  public static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { type, status, search, scope, onlyBranches } = req.query;
      if (scope === 'true' || scope === '1') {
        return await OperationUnitController.getMyScope(req, res);
      }

      const filters: any = {};
      if (type) filters.type = String(type);
      else if (onlyBranches === 'true' || onlyBranches === '1') filters.type = 'OPERATION_UNIT';

      if (status !== undefined) filters.status = status === 'true' || status === '1';
      if (search) filters.search = String(search);

      const items = await OperationUnitController.useCase.getAll(filters);
      res.status(200).json(items.map(i => i.props));
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil data Operation Unit.' });
    }
  }

  public static async getMyScope(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { type, status, search, onlyBranches } = req.query;

      const isSuperAdmin = user?.jenis === 'SA' || user?.username === 'admin' || user?.scope?.isSuperAdmin;
      const userUnitId = user?.scope?.unitId || user?.karyawan?.operationUnitId || null;
      const userId = user?.sub || user?.id || null;

      const filters: any = {};
      if (type) filters.type = String(type);
      else if (onlyBranches === 'true' || onlyBranches === '1') filters.type = 'OPERATION_UNIT';

      if (status !== undefined) filters.status = status === 'true' || status === '1';
      if (search) filters.search = String(search);

      const items = await OperationUnitController.useCase.getScopedUnits({
        isSuperAdmin,
        userUnitId,
        userId,
        filters
      });

      res.status(200).json(items);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil data Operation Unit scope.' });
    }
  }

  public static async getTree(req: Request, res: Response): Promise<void> {
    try {
      const tree = await OperationUnitController.useCase.getTree();
      res.status(200).json(tree);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal mengambil pohon hierarki Operation Unit.' });
    }
  }

  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await OperationUnitController.useCase.getById(id);
      res.status(200).json({
        ...result.unit.props,
        lineage: result.lineage
      });
    } catch (error: any) {
      res.status(404).json({ message: error.message || 'Operation Unit tidak ditemukan.' });
    }
  }

  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.sub || (req as any).user?.id || null;
      const unit = await OperationUnitController.useCase.create({
        ...req.body,
        createdBy: userId
      });
      res.status(201).json(unit.props);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal membuat Operation Unit.' });
    }
  }

  public static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.sub || (req as any).user?.id || null;
      const unit = await OperationUnitController.useCase.update(id, {
        ...req.body,
        updatedBy: userId
      });
      res.status(200).json(unit.props);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal memperbarui Operation Unit.' });
    }
  }

  public static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await OperationUnitController.useCase.delete(id);
      res.status(200).json({ message: 'Operation Unit berhasil dihapus.' });
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Gagal menghapus Operation Unit.' });
    }
  }
}
