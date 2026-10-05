import { IMenuRepository } from '../../domain/repositories/IMenuRepository';
import { Menu } from '../../domain/entities/Menu';

export class ManageMenuUseCase {
  constructor(private readonly menuRepository: IMenuRepository) {}

  async getAll(): Promise<Menu[]> {
    return await this.menuRepository.findAll();
  }

  async getById(id: string): Promise<Menu | null> {
    return await this.menuRepository.findById(id);
  }

  async create(
    data: {
      upline?: string | null;
      urut: number;
      nama: string;
      tipe: string;
      level?: number;
      link: string;
      icon: string;
      aktif: number;
    },
    creatorUserId?: string
  ): Promise<Menu> {
    const uplineId = data.upline && data.upline.trim() !== '' ? data.upline.trim() : null;
    let level = data.level || 1;

    // Determine level from parent if upline provided
    if (uplineId) {
      const parent = await this.menuRepository.findById(uplineId);
      level = parent ? parent.level + 1 : Math.max(2, level);
    }

    const menu = new Menu(
      '', // ID akan di-generate oleh Prisma / Database
      uplineId,
      data.urut !== undefined ? Number(data.urut) : 0,
      data.nama,
      data.tipe,
      level,
      data.link,
      data.icon,
      data.aktif !== undefined ? Number(data.aktif) : 1
    );
    const created = await this.menuRepository.create(menu);

    if (creatorUserId && this.menuRepository.assignDefaultAcl) {
      await this.menuRepository.assignDefaultAcl(created.id, creatorUserId);
    }

    return created;
  }

  async update(id: string, data: Partial<Menu>): Promise<Menu> {
    const existing = await this.menuRepository.findById(id);
    if (!existing) {
      throw new Error('Menu tidak ditemukan.');
    }

    const payload: any = { ...data };
    if (payload.upline !== undefined) {
      const uplineId = payload.upline && String(payload.upline).trim() !== '' ? String(payload.upline).trim() : null;
      payload.upline = uplineId;
      if (payload.level === undefined || payload.level === null) {
        if (uplineId) {
          const parent = await this.menuRepository.findById(uplineId);
          payload.level = parent ? parent.level + 1 : existing.level;
        } else {
          payload.level = 1; // root
        }
      }
    }

    return await this.menuRepository.update(id, payload);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.menuRepository.findById(id);
    if (!existing) {
      throw new Error('Menu tidak ditemukan.');
    }
    await this.menuRepository.delete(id);
  }
}
