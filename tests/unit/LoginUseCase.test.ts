import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from '../../src/application/use-cases/LoginUseCase';
import { User } from '../../src/domain/entities/User';

describe('LoginUseCase Unit Tests', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepo: any;
  let mockLogRepo: any;
  let mockHasher: any;
  let mockTokenService: any;
  let mockSessionRepo: any;

  const validUser = new User(
    'usr-1',
    'admin',
    '*01A6717B58FF5C7EAFFF6CB7C96F7428EA65FE4C', // Legacy hash
    1,
    new Date('2020-01-01'),
    new Date('2030-12-31'),
    'SA',
    null
  );

  beforeEach(() => {
    mockUserRepo = {
      findByUsername: vi.fn(),
      findPermissionsByUserId: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    };
    mockLogRepo = {
      create: vi.fn().mockResolvedValue({}),
    };
    mockHasher = {
      compare: vi.fn(),
      hash: vi.fn().mockReturnValue('$2b$12$newBcryptHashValue12345'),
      needsRehash: vi.fn(),
    };
    mockTokenService = {
      sign: vi.fn().mockReturnValue('mock-jwt-access-token'),
      generateRefreshToken: vi.fn().mockReturnValue('raw-refresh-token-xyz'),
      hashRefreshToken: vi.fn().mockReturnValue('hashed-refresh-token-xyz'),
    };
    mockSessionRepo = {
      create: vi.fn().mockResolvedValue({}),
    };

    loginUseCase = new LoginUseCase(
      mockUserRepo,
      mockLogRepo,
      mockHasher,
      mockTokenService,
      mockSessionRepo
    );
  });

  it('harus berhasil login dengan kredensial valid dan mengembalikan dual-token', async () => {
    mockUserRepo.findByUsername.mockResolvedValue(validUser);
    mockHasher.compare.mockReturnValue(true);
    mockHasher.needsRehash.mockReturnValue(false);

    const result = await loginUseCase.execute({
      username: 'admin',
      password: 'admin123',
    });

    expect(result.accessToken).toBe('mock-jwt-access-token');
    expect(result.refreshToken).toBe('raw-refresh-token-xyz');
    expect(result.user.username).toBe('admin');
    expect(mockSessionRepo.create).toHaveBeenCalled();
    expect(mockLogRepo.create).toHaveBeenCalledWith('usr-1', 'SUKSES', null, 'Login berhasil');
  });

  it('harus memicu Transparent Lazy Re-hashing jika password masih legacy', async () => {
    mockUserRepo.findByUsername.mockResolvedValue(validUser);
    mockHasher.compare.mockReturnValue(true);
    mockHasher.needsRehash.mockReturnValue(true); // Memerlukan upgrade ke bcrypt

    await loginUseCase.execute({
      username: 'admin',
      password: 'admin123',
    });

    expect(mockHasher.hash).toHaveBeenCalledWith('admin123');
    expect(mockUserRepo.update).toHaveBeenCalledWith('usr-1', {
      passwordHash: '$2b$12$newBcryptHashValue12345',
    });
  });

  it('harus melempar error jika username tidak ditemukan', async () => {
    mockUserRepo.findByUsername.mockResolvedValue(null);

    await expect(
      loginUseCase.execute({ username: 'nonexistent', password: '123' })
    ).rejects.toThrow('Username atau password tidak cocok.');
  });

  it('harus melempar error dan mencatat audit GAGAL jika password salah', async () => {
    mockUserRepo.findByUsername.mockResolvedValue(validUser);
    mockHasher.compare.mockReturnValue(false);

    await expect(
      loginUseCase.execute({ username: 'admin', password: 'wrongpassword' })
    ).rejects.toThrow('Username atau password tidak cocok.');

    expect(mockLogRepo.create).toHaveBeenCalledWith('usr-1', 'GAGAL', null, 'Password salah');
  });

  it('harus melempar error jika akun dinonaktifkan', async () => {
    const inactiveUser = new User(
      'usr-2',
      'user_mati',
      'hash',
      0, // Nonaktif
      new Date('2020-01-01'),
      new Date('2030-12-31'),
      'pegawai',
      null
    );

    mockUserRepo.findByUsername.mockResolvedValue(inactiveUser);
    mockHasher.compare.mockReturnValue(true);

    await expect(
      loginUseCase.execute({ username: 'user_mati', password: '123' })
    ).rejects.toThrow('Akun Anda dinonaktifkan atau masa aktif telah berakhir.');

    expect(mockLogRepo.create).toHaveBeenCalledWith(
      'usr-2',
      'GAGAL',
      null,
      'Akun kadaluarsa / nonaktif'
    );
  });
});
