import {
  IUserRepository,
  UserWithRoles,
  UserRoleItem,
} from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from './LoginUseCase';
import { randomUUID } from 'node:crypto';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface CreateUserDto {
  id?: string;
  username: string;
  password: string;
  aktif?: number;
  tgl1?: string | Date;
  tgl2?: string | Date;
  jenis?: string;
  idRelasi?: string;
  roleIds?: string[];
}

export interface UpdateUserDto {
  username?: string;
  password?: string;
  aktif?: number;
  tgl1?: string | Date;
  tgl2?: string | Date;
  jenis?: string;
  idRelasi?: string;
  roleIds?: string[];
}

export class ManageUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async getAll(): Promise<UserWithRoles[]> {
    return this.userRepository.findAllWithRoles();
  }

  async getById(id: string): Promise<UserWithRoles | null> {
    return this.userRepository.findByIdWithRoles(id);
  }

  async create(dto: CreateUserDto): Promise<UserWithRoles> {
    if (!dto.username || !dto.password) {
      throw new Error('Username dan password wajib diisi.');
    }

    const userId = dto.id?.trim() || randomUUID();
    if (!UUID_PATTERN.test(userId)) {
      throw new Error('ID Pengguna harus berupa UUID yang valid. ID dibuat otomatis oleh sistem.');
    }
    if (dto.idRelasi && !UUID_PATTERN.test(dto.idRelasi.trim())) {
      throw new Error('Relasi Karyawan harus menggunakan UUID yang valid atau dikosongkan.');
    }

    const existing = await this.userRepository.findByUsername(dto.username.trim());
    if (existing) {
      throw new Error(`Username "${dto.username}" sudah digunakan.`);
    }

    const passwordHash = this.passwordHasher.hash
      ? this.passwordHasher.hash(dto.password)
      : (this.passwordHasher as any).hashLegacy
      ? (this.passwordHasher as any).hashLegacy(dto.password)
      : dto.password;

    const tgl1 = dto.tgl1 ? new Date(dto.tgl1) : new Date();
    const tgl2 = dto.tgl2 ? new Date(dto.tgl2) : new Date('2035-12-31');

    return this.userRepository.create({
      id: userId,
      username: dto.username.trim(),
      passwordHash,
      aktif: dto.aktif !== undefined ? Number(dto.aktif) : 1,
      tgl1,
      tgl2,
      jenis: dto.jenis || 'pegawai',
      idRelasi: dto.idRelasi?.trim() || null,
      roleIds: dto.roleIds || [],
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserWithRoles> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    if (dto.username && dto.username.trim() !== existing.username) {
      const duplicate = await this.userRepository.findByUsername(dto.username.trim());
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Username "${dto.username}" sudah digunakan oleh pengguna lain.`);
      }
    }

    const updatePayload: any = {};
    if (dto.username) updatePayload.username = dto.username.trim();
    if (dto.password && dto.password.trim().length > 0) {
      updatePayload.passwordHash = this.passwordHasher.hash
        ? this.passwordHasher.hash(dto.password)
        : (this.passwordHasher as any).hashLegacy
        ? (this.passwordHasher as any).hashLegacy(dto.password)
        : dto.password;
    }
    if (dto.aktif !== undefined) updatePayload.aktif = Number(dto.aktif);
    if (dto.tgl1) updatePayload.tgl1 = new Date(dto.tgl1);
    if (dto.tgl2) updatePayload.tgl2 = new Date(dto.tgl2);
    if (dto.jenis) updatePayload.jenis = dto.jenis;
    if (dto.idRelasi !== undefined) {
      if (dto.idRelasi && !UUID_PATTERN.test(dto.idRelasi.trim())) {
        throw new Error('Relasi Karyawan harus menggunakan UUID yang valid atau dikosongkan.');
      }
      updatePayload.idRelasi = dto.idRelasi.trim() || null;
    }
    if (dto.roleIds !== undefined) updatePayload.roleIds = dto.roleIds;

    return this.userRepository.update(id, updatePayload);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    if (existing.username === 'admin') {
      throw new Error('Akun super admin utama tidak boleh dihapus.');
    }

    await this.userRepository.delete(id);
  }

  async getUserRoles(userId: string): Promise<UserRoleItem[]> {
    return this.userRepository.getUserRoles(userId);
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    const existing = await this.userRepository.findById(userId);
    if (!existing) {
      throw new Error('Pengguna tidak ditemukan.');
    }
    await this.userRepository.assignRoles(userId, roleIds || []);
  }
}
