import { IRoleAclRepository, RoleAclItem, RoleAclMenuItem } from '../../domain/repositories/IRoleAclRepository';

export class ManageRoleAclUseCase {
  constructor(private readonly roleAclRepository: IRoleAclRepository) {}

  async getForRole(roleId: string): Promise<RoleAclMenuItem[]> {
    if (!roleId) {
      throw new Error('Role ID harus disediakan.');
    }
    return this.roleAclRepository.getForRole(roleId);
  }

  async getTemplate(): Promise<RoleAclMenuItem[]> {
    return this.roleAclRepository.getTemplate();
  }

  async updateForRole(roleId: string, acls: RoleAclItem[]): Promise<void> {
    if (!roleId) {
      throw new Error('Role ID harus disediakan.');
    }
    await this.roleAclRepository.updateForRole(roleId, acls || []);
  }
}
