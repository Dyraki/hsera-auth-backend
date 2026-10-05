export interface RoleAclItem {
  menuId: string;
  enable: number;
  level: number;
}

export interface RoleAclMenuItem {
  id: string;
  upline: string | null;
  urut: number;
  nama: string;
  tipe: string;
  level: number;
  link: string;
  icon: string;
  aktif: number;
  acl: {
    enable: number;
    level: number;
    c: number;
    r: number;
    u: number;
    d: number;
  };
}

export interface IRoleAclRepository {
  getForRole(roleId: string): Promise<RoleAclMenuItem[]>;
  getTemplate(): Promise<RoleAclMenuItem[]>;
  updateForRole(roleId: string, acls: RoleAclItem[]): Promise<void>;
}
