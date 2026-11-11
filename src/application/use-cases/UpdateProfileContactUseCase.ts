import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IKaryawanRepository } from '../../domain/repositories/IKaryawanRepository';

export interface UpdateProfileContactInput {
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  postalCode?: string | null;
}

export class UpdateProfileContactUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly karyawanRepository: IKaryawanRepository
  ) {}

  async execute(userId: string, input: UpdateProfileContactInput) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    if (!user.idRelasi) {
      throw new Error('Akun ini tidak terhubung dengan profil data karyawan.');
    }

    // Validasi email jika diisi
    if (input.email !== undefined && input.email !== null && input.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.email.trim())) {
        throw new Error('Format alamat email tidak valid.');
      }
    }

    // Validasi nomor telepon/hp jika diisi
    if (input.phone !== undefined && input.phone !== null && input.phone.trim() !== '') {
      const phoneClean = input.phone.trim();
      if (!/^[0-9+\-\s]{8,20}$/.test(phoneClean)) {
        throw new Error('Format nomor telepon/WhatsApp tidak valid (minimal 8 digit).');
      }
    }

    await this.karyawanRepository.update(user.idRelasi, {
      email: input.email !== undefined ? (input.email ? input.email.trim() : null) : undefined,
      phone: input.phone !== undefined ? (input.phone ? input.phone.trim() : null) : undefined,
      address: input.address !== undefined ? (input.address ? input.address.trim() : null) : undefined,
      postalCode: input.postalCode !== undefined ? (input.postalCode ? input.postalCode.trim() : null) : undefined,
      updatedBy: user.username,
    });

    return {
      message: 'Data kontak profil berhasil diperbarui.',
    };
  }
}
