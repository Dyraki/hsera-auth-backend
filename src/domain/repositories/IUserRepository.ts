import { User } from '../entities/User';

export interface UserPermission {
  menuId: string;
  enable: boolean;
  level: number;
}

export interface UserRoleItem {
  id: string;
  nama: string;
  aktif: number;
}

export interface UserWithRoles {
  id: string;
  username: string;
  aktif: number;
  tgl1: Date;
  tgl2: Date;
  jenis: string;
  idRelasi: string | null;
  roles: UserRoleItem[];
}

export interface CreateUserInput {
  id?: string;
  username: string;
  passwordHash: string;
  aktif: number;
  tgl1: Date;
  tgl2: Date;
  jenis: string;
  idRelasi?: string | null;
  roleIds?: string[];
}

export interface UpdateUserInput {
  username?: string;
  passwordHash?: string;
  aktif?: number;
  tgl1?: Date;
  tgl2?: Date;
  jenis?: string;
  idRelasi?: string | null;
  roleIds?: string[];
}

export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findPermissionsByUserId(userId: string): Promise<UserPermission[]>;
  findAllWithRoles(): Promise<UserWithRoles[]>;
  findByIdWithRoles(id: string): Promise<UserWithRoles | null>;
  create(input: CreateUserInput): Promise<UserWithRoles>;
  update(id: string, input: UpdateUserInput): Promise<UserWithRoles>;
  delete(id: string): Promise<void>;
  getUserRoles(userId: string): Promise<UserRoleItem[]>;
  assignRoles(userId: string, roleIds: string[]): Promise<void>;
}
