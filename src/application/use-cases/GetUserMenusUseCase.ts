import { IMenuRepository } from '../../domain/repositories/IMenuRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export interface UserMenuNode {
  id: string;
  upline: string | null;
  urut: number;
  nama: string;
  tipe: string;
  level: number;
  link: string;
  icon: string;
  aktif: number;
  submenus: UserMenuNode[];
}

export interface GetUserMenusInput {
  userId: string;
  username: string;
  jenis: string;
}

export class GetUserMenusUseCase {
  constructor(
    private readonly menuRepository: IMenuRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: GetUserMenusInput): Promise<UserMenuNode[]> {
    const allMenus = await this.menuRepository.findAll();
    const permissions = input.userId
      ? await this.userRepository.findPermissionsByUserId(input.userId)
      : [];

    const isSuper =
      input.username === 'admin' ||
      input.jenis === 'SA' ||
      input.jenis === 'admin';

    const isAllowed = (menu: any): boolean => {
      if (isSuper) return true;
      const perm = permissions.find((p: any) => String(p.menuId) === String(menu.id));
      return !!perm && !!perm.enable;
    };

    const buildTree = (level: number, upline: string | null): UserMenuNode[] => {
      const candidates = allMenus
        .filter((m) => {
          if (m.level !== level || m.aktif !== 1) return false;
          if (upline === null) {
            return !m.upline || m.upline === '0';
          }
          return m.upline === upline;
        })
        .sort(
          (a, b) =>
            Number(a.urut) - Number(b.urut) ||
            String(a.id).localeCompare(String(b.id))
        );

      const nodes: UserMenuNode[] = [];
      for (const m of candidates) {
        const children = buildTree(level + 1, m.id);
        const allowed = isAllowed(m);

        if (m.tipe === 'Header') {
          if (allowed || children.length > 0) {
            nodes.push({
              id: m.id,
              upline: m.upline,
              urut: m.urut,
              nama: m.nama,
              tipe: m.tipe,
              level: m.level,
              link: m.link,
              icon: m.icon,
              aktif: m.aktif,
              submenus: children,
            });
          }
        } else {
          if (allowed) {
            nodes.push({
              id: m.id,
              upline: m.upline,
              urut: m.urut,
              nama: m.nama,
              tipe: m.tipe,
              level: m.level,
              link: m.link,
              icon: m.icon,
              aktif: m.aktif,
              submenus: [],
            });
          }
        }
      }

      return nodes;
    };

    return buildTree(1, null);
  }
}
