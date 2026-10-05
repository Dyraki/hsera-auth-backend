import { Menu } from '../entities/Menu';

export interface IMenuRepository {
  findAll(): Promise<Menu[]>;
  findById(id: string): Promise<Menu | null>;
  create(menu: Menu): Promise<Menu>;
  update(id: string, menu: Partial<Menu>): Promise<Menu>;
  delete(id: string): Promise<void>;
  assignDefaultAcl?(menuId: string, userId: string): Promise<void>;
}
