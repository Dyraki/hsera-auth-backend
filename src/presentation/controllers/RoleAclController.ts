import { Request, Response } from 'express';
import { ManageRoleAclUseCase } from '../../application/use-cases/ManageRoleAclUseCase';
import { PrismaRoleAclRepository } from '../../infrastructure/database/repositories/PrismaRoleAclRepository';

export class RoleAclController {
  private static readonly roleAclRepository = new PrismaRoleAclRepository();
  private static readonly manageRoleAclUseCase = new ManageRoleAclUseCase(RoleAclController.roleAclRepository);

  // Return menus with ACL values for a specific role
  public static async getForRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await RoleAclController.manageRoleAclUseCase.getForRole(id);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Gagal mengambil ACL role.' });
    }
  }

  // Return a template of menus with default ACLs (for new role)
  public static async getTemplate(req: Request, res: Response): Promise<void> {
    try {
      const result = await RoleAclController.manageRoleAclUseCase.getTemplate();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Gagal mengambil template ACL.' });
    }
  }

  // Update ACLs for a role: replace existing ACLs with provided list
  public static async updateForRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const payload = req.body || [];
      await RoleAclController.manageRoleAclUseCase.updateForRole(id, payload);
      res.status(200).json({ message: 'ACL role berhasil diperbarui.' });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Gagal memperbarui ACL role.' });
    }
  }
}
