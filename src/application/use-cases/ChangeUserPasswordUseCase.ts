import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from './LoginUseCase';
import { PasswordValidator } from '../../infrastructure/security/PasswordValidator';

export interface ChangeUserPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export class ChangeUserPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(userId: string, input: ChangeUserPasswordInput): Promise<{ message: string }> {
    if (!input.currentPassword) {
      throw new Error('Kata sandi saat ini wajib diisi.');
    }

    if (!input.newPassword) {
      throw new Error('Kata sandi baru wajib diisi.');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    // 1. Verifikasi kecocokan kata sandi lama
    const isCurrentValid = await this.passwordHasher.compare(input.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new Error('Kata sandi saat ini yang Anda masukkan salah.');
    }

    // 2. Cegah penggunaan kata sandi yang sama persis
    if (input.currentPassword === input.newPassword) {
      throw new Error('Kata sandi baru tidak boleh sama dengan kata sandi saat ini.');
    }

    // 3. Validasi kekuatan sandi baru sesuai standar internasional NIST SP 800-63B & OWASP ASVS 4.0
    const validation = PasswordValidator.validate(input.newPassword, user.username);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Kata sandi baru tidak memenuhi kriteria keamanan.');
    }

    // 4. Hash kata sandi baru dan simpan ke database
    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);
    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
    });

    return {
      message: 'Kata sandi berhasil diperbarui dengan aman.',
    };
  }
}
