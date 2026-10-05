import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { Role } from '../../domain/entities/Role';
import { randomUUID } from 'node:crypto';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ManageRoleUseCase {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async getAll(): Promise<Role[]> {
    return await this.roleRepository.findAll();
  }

  async getById(id: string): Promise<Role | null> {
    return await this.roleRepository.findById(id);
  }

  async create(data: { id?: string; nama: string; aktif: number }): Promise<Role> {
    const roleId = data.id?.trim() || randomUUID();
    if (!UUID_PATTERN.test(roleId)) {
      throw new Error('ID Role harus berupa UUID yang valid. ID dibuat otomatis oleh sistem.');
    }

    const existing = await this.roleRepository.findById(roleId);
    if (existing) {
      throw new Error('Role ID sudah terdaftar.');
    }

    const role = new Role(roleId, data.nama, data.aktif);
    return await this.roleRepository.create(role);
  }

  async update(id: string, data: Partial<Role>): Promise<Role> {
    const existing = await this.roleRepository.findById(id);
    if (!existing) {
      throw new Error('Role tidak ditemukan.');
    }
    return await this.roleRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.roleRepository.findById(id);
    if (!existing) {
      throw new Error('Role tidak ditemukan.');
    }
    await this.roleRepository.delete(id);
  }
}
