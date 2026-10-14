import { IRoleAclRepository, RoleAclItem, RoleAclMenuItem } from '../../../domain/repositories/IRoleAclRepository';
import { PrismaService } from '../PrismaService';

export class PrismaRoleAclRepository implements IRoleAclRepository {
  private readonly prisma = PrismaService.getClient();

  async getForRole(roleId: string): Promise<RoleAclMenuItem[]> {
    const menus = await this.prisma.menu.findMany({
      orderBy: [{ upline: 'asc' }, { urut: 'asc' }, { id: 'asc' }],
    });
    const acls = await this.prisma.loginGrpAcl.findMany({
      where: { loginGrpId: roleId },
    });

    const aclMap: { [menuId: string]: any } = {};
    for (const a of acls) {
      aclMap[a.menuId] = a;
    }

    return menus.map((m) => {
      const acl = aclMap[m.id];
      const enable = acl ? acl.enable === 1 : false;
      const rawLevel = acl ? acl.level : 0;

      let c = 0, r = 0, u = 0, d = 0;
      let normalizedLevel = rawLevel;

      if (rawLevel === 4) {
        c = 1; r = 1; u = 1; d = 1;
        normalizedLevel = 1111;
      } else if (rawLevel === 3) {
        c = 1; r = 1; u = 1; d = 0;
        normalizedLevel = 1110;
      } else if (rawLevel === 2) {
        c = 1; r = 1; u = 0; d = 0;
        normalizedLevel = 1100;
      } else if (rawLevel === 1) {
        c = 0; r = 1; u = 0; d = 0;
        normalizedLevel = 100;
      } else {
        const levelStr = String(rawLevel).padStart(4, '0');
        c = levelStr[levelStr.length - 4] === '1' ? 1 : 0;
        r = levelStr[levelStr.length - 3] === '1' ? 1 : 0;
        u = levelStr[levelStr.length - 2] === '1' ? 1 : 0;
        d = levelStr[levelStr.length - 1] === '1' ? 1 : 0;
      }

      return {
        id: m.id,
        upline: m.upline,
        urut: m.urut,
        nama: m.nama,
        tipe: m.tipe,
        level: m.level,
        link: m.link,
        icon: m.icon,
        aktif: m.aktif,
        acl: {
          enable: enable ? 1 : 0,
          level: normalizedLevel,
          c,
          r,
          u,
          d,
        },
      };
    });
  }

  async getTemplate(): Promise<RoleAclMenuItem[]> {
    const menus = await this.prisma.menu.findMany({
      orderBy: [{ upline: 'asc' }, { urut: 'asc' }, { id: 'asc' }],
    });

    return menus.map((m) => ({
      id: m.id,
      upline: m.upline,
      urut: m.urut,
      nama: m.nama,
      tipe: m.tipe,
      level: m.level,
      link: m.link,
      icon: m.icon,
      aktif: m.aktif,
      acl: { enable: 0, level: 0, c: 0, r: 0, u: 0, d: 0 },
    }));
  }

  async updateForRole(roleId: string, acls: RoleAclItem[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.loginGrpAcl.deleteMany({ where: { loginGrpId: roleId } });
      if (acls && acls.length > 0) {
        for (const item of acls) {
          await tx.loginGrpAcl.create({
            data: {
              loginGrpId: roleId,
              menuId: item.menuId,
              enable: item.enable,
              level: item.level,
            },
          });
        }
      }
    });
  }
}
