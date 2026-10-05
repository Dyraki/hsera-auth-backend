import { IRoleRepository } from '../../../domain/repositories/IRoleRepository';
import { Role } from '../../../domain/entities/Role';
import { PrismaService } from '../PrismaService';

export class PrismaRoleRepository implements IRoleRepository {
  private readonly prisma = PrismaService.getClient();

  async findAll(): Promise<Role[]> {
    const dbRoles = await this.prisma.loginGrp.findMany({
      orderBy: { id: 'asc' }
    });

    return dbRoles.map(db => new Role(
      db.id,
      db.nama,
      db.aktif
    ));
  }

  async findById(id: string): Promise<Role | null> {
    const db = await this.prisma.loginGrp.findUnique({
      where: { id }
    });

    if (!db) return null;

    return new Role(
      db.id,
      db.nama,
      db.aktif
    );
  }

  async create(role: Role): Promise<Role> {
    const db = await this.prisma.loginGrp.create({
      data: {
        id: role.id,
        nama: role.nama,
        aktif: role.aktif
      }
    });

    return new Role(
      db.id,
      db.nama,
      db.aktif
    );
  }

  async update(id: string, role: Partial<Role>): Promise<Role> {
    const db = await this.prisma.loginGrp.update({
      where: { id },
      data: {
        nama: role.nama,
        aktif: role.aktif
      }
    });

    return new Role(
      db.id,
      db.nama,
      db.aktif
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.loginGrp.delete({
      where: { id }
    });
  }
}
