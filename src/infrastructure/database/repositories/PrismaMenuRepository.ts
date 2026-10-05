import { IMenuRepository } from '../../../domain/repositories/IMenuRepository';
import { Menu } from '../../../domain/entities/Menu';
import { PrismaService } from '../PrismaService';

export class PrismaMenuRepository implements IMenuRepository {
  private readonly prisma = PrismaService.getClient();

  async findAll(): Promise<Menu[]> {
    const dbMenus = await this.prisma.menu.findMany({
      orderBy: [
        { upline: 'asc' },
        { urut: 'asc' },
        { nama: 'asc' }
      ]
    });

    return dbMenus.map(db => new Menu(
      db.id,
      db.upline,
      db.urut,
      db.nama,
      db.tipe,
      db.level,
      db.link,
      db.icon,
      db.aktif
    ));
  }

  async findById(id: string): Promise<Menu | null> {
    const db = await this.prisma.menu.findUnique({
      where: { id }
    });

    if (!db) return null;

    return new Menu(
      db.id,
      db.upline,
      db.urut,
      db.nama,
      db.tipe,
      db.level,
      db.link,
      db.icon,
      db.aktif
    );
  }

  async create(menu: Menu): Promise<Menu> {
    const data: any = {
      upline: menu.upline && menu.upline.trim() !== '' ? menu.upline.trim() : null,
      urut: menu.urut !== undefined && menu.urut !== null ? Number(menu.urut) : 0,
      nama: menu.nama,
      tipe: menu.tipe,
      level: menu.level !== undefined && menu.level !== null ? Number(menu.level) : 1,
      link: menu.link || '#',
      icon: menu.icon || 'glyphicon glyphicon-file',
      aktif: menu.aktif !== undefined && menu.aktif !== null ? Number(menu.aktif) : 1
    };

    if (menu.id && menu.id.trim() !== '') {
      data.id = menu.id.trim();
    }

    const db = await this.prisma.menu.create({ data });

    return new Menu(
      db.id,
      db.upline,
      db.urut,
      db.nama,
      db.tipe,
      db.level,
      db.link,
      db.icon,
      db.aktif
    );
  }

  async update(id: string, menu: Partial<Menu>): Promise<Menu> {
    const data: any = {};
    if (menu.upline !== undefined) {
      data.upline = menu.upline && String(menu.upline).trim() !== '' ? String(menu.upline).trim() : null;
    }
    if (menu.urut !== undefined && menu.urut !== null) data.urut = Number(menu.urut);
    if (menu.nama !== undefined) data.nama = menu.nama;
    if (menu.tipe !== undefined) data.tipe = menu.tipe;
    if (menu.level !== undefined && menu.level !== null) data.level = Number(menu.level);
    if (menu.link !== undefined) data.link = menu.link;
    if (menu.icon !== undefined) data.icon = menu.icon;
    if (menu.aktif !== undefined && menu.aktif !== null) data.aktif = Number(menu.aktif);

    const db = await this.prisma.menu.update({ where: { id }, data });

    return new Menu(
      db.id,
      db.upline,
      db.urut,
      db.nama,
      db.tipe,
      db.level,
      db.link,
      db.icon,
      db.aktif
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.menu.delete({
      where: { id }
    });
  }

  async assignDefaultAcl(menuId: string, userId: string): Promise<void> {
    try {
      const groups = await this.prisma.loginUsrGrp.findMany({
        where: { loginUsrId: userId },
        select: { loginGrpId: true }
      });
      for (const g of groups) {
        await this.prisma.loginGrpAcl.create({
          data: {
            loginGrpId: g.loginGrpId,
            menuId: menuId,
            enable: 1,
            level: 4
          }
        });
      }
    } catch (e) {
      console.error('PrismaMenuRepository: Gagal membuat ACL otomatis:', e);
    }
  }
}
