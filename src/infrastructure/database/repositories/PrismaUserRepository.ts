import {
  IUserRepository,
  UserPermission,
  UserWithRoles,
  UserRoleItem,
  CreateUserInput,
  UpdateUserInput,
} from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { PrismaService } from '../PrismaService';
import * as crypto from 'crypto';

export class PrismaUserRepository implements IUserRepository {
  private readonly prisma = PrismaService.getClient();

  async findByUsername(username: string): Promise<User | null> {
    const dbUser = await this.prisma.loginUsr.findUnique({
      where: { username },
    });

    if (!dbUser) return null;

    return new User(
      dbUser.id,
      dbUser.username,
      dbUser.passwd,
      dbUser.aktif,
      dbUser.tgl1,
      dbUser.tgl2,
      dbUser.jenis,
      dbUser.idRelasi
    );
  }

  async findById(id: string): Promise<User | null> {
    const dbUser = await this.prisma.loginUsr.findUnique({
      where: { id },
    });

    if (!dbUser) return null;

    return new User(
      dbUser.id,
      dbUser.username,
      dbUser.passwd,
      dbUser.aktif,
      dbUser.tgl1,
      dbUser.tgl2,
      dbUser.jenis,
      dbUser.idRelasi
    );
  }

  async findPermissionsByUserId(userId: string): Promise<UserPermission[]> {
    // 1. Dapatkan daftar grup yang diikuti user
    const userGroups = await this.prisma.loginUsrGrp.findMany({
      where: { loginUsrId: userId },
      select: { loginGrpId: true },
    });

    const groupIds = userGroups.map((ug) => ug.loginGrpId);
    if (groupIds.length === 0) return [];

    // 2. Dapatkan seluruh ACL untuk grup-grup tersebut
    const acls = await this.prisma.loginGrpAcl.findMany({
      where: {
        loginGrpId: { in: groupIds },
      },
    });

    // 3. Gabungkan hak akses: jika ada yang aktif (1) maka diaktifkan,
    //    dan ambil level akses yang tertinggi.
    const permissionMap: { [menuId: string]: UserPermission } = {};

    for (const acl of acls) {
      const menuId = acl.menuId;
      const isEnabled = acl.enable === 1;
      const level = acl.level;

      if (!permissionMap[menuId]) {
        permissionMap[menuId] = {
          menuId,
          enable: isEnabled,
          level,
        };
      } else {
        permissionMap[menuId].enable = permissionMap[menuId].enable || isEnabled;
        permissionMap[menuId].level = Math.max(permissionMap[menuId].level, level);
      }
    }

    return Object.values(permissionMap);
  }

  async findAllWithRoles(): Promise<UserWithRoles[]> {
    const users = await this.prisma.loginUsr.findMany({
      include: {
        groups: {
          include: {
            group: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      aktif: u.aktif,
      tgl1: u.tgl1,
      tgl2: u.tgl2,
      jenis: u.jenis,
      idRelasi: u.idRelasi,
      roles: u.groups.map((g) => ({
        id: g.group.id,
        nama: g.group.nama,
        aktif: g.group.aktif,
      })),
    }));
  }

  async findByIdWithRoles(id: string): Promise<UserWithRoles | null> {
    const u = await this.prisma.loginUsr.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!u) return null;

    return {
      id: u.id,
      username: u.username,
      aktif: u.aktif,
      tgl1: u.tgl1,
      tgl2: u.tgl2,
      jenis: u.jenis,
      idRelasi: u.idRelasi,
      roles: u.groups.map((g) => ({
        id: g.group.id,
        nama: g.group.nama,
        aktif: g.group.aktif,
      })),
    };
  }

  async create(input: CreateUserInput): Promise<UserWithRoles> {
    const userId = input.id && input.id.trim() !== '' ? input.id.trim() : crypto.randomUUID();

    await this.prisma.$transaction(async (tx) => {
      await tx.loginUsr.create({
        data: {
          id: userId,
          username: input.username,
          passwd: input.passwordHash,
          aktif: input.aktif,
          tgl1: input.tgl1,
          tgl2: input.tgl2,
          jenis: input.jenis,
          idRelasi: input.idRelasi || null,
        },
      });

      if (input.roleIds && input.roleIds.length > 0) {
        for (const roleId of input.roleIds) {
          await tx.loginUsrGrp.create({
            data: {
              loginUsrId: userId,
              loginGrpId: roleId,
            },
          });
        }
      }
    });

    const created = await this.findByIdWithRoles(userId);
    if (!created) throw new Error('Gagal memuat pengguna setelah disimpan.');
    return created;
  }

  async update(id: string, input: UpdateUserInput): Promise<UserWithRoles> {
    const data: any = {};
    if (input.username !== undefined) data.username = input.username;
    if (input.passwordHash !== undefined) data.passwd = input.passwordHash;
    if (input.aktif !== undefined) data.aktif = input.aktif;
    if (input.tgl1 !== undefined) data.tgl1 = input.tgl1;
    if (input.tgl2 !== undefined) data.tgl2 = input.tgl2;
    if (input.jenis !== undefined) data.jenis = input.jenis;
    if (input.idRelasi !== undefined) data.idRelasi = input.idRelasi || null;

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.loginUsr.update({
          where: { id },
          data,
        });
      }

      if (input.roleIds !== undefined) {
        await tx.loginUsrGrp.deleteMany({
          where: { loginUsrId: id },
        });

        for (const roleId of input.roleIds) {
          await tx.loginUsrGrp.create({
            data: {
              loginUsrId: id,
              loginGrpId: roleId,
            },
          });
        }
      }
    });

    const updated = await this.findByIdWithRoles(id);
    if (!updated) throw new Error('Gagal memuat pengguna setelah diperbarui.');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.loginUsr.delete({
      where: { id },
    });
  }

  async getUserRoles(userId: string): Promise<UserRoleItem[]> {
    const relations = await this.prisma.loginUsrGrp.findMany({
      where: { loginUsrId: userId },
      include: { group: true },
    });

    return relations.map((r) => ({
      id: r.group.id,
      nama: r.group.nama,
      aktif: r.group.aktif,
    }));
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.loginUsrGrp.deleteMany({
        where: { loginUsrId: userId },
      });

      for (const roleId of roleIds) {
        await tx.loginUsrGrp.create({
          data: {
            loginUsrId: userId,
            loginGrpId: roleId,
          },
        });
      }
    });
  }
}
