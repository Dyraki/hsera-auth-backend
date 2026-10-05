import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RefreshTokenUseCase } from '../../src/application/use-cases/RefreshTokenUseCase';
import { UserSession } from '../../src/domain/entities/UserSession';
import { User } from '../../src/domain/entities/User';

describe('RefreshTokenUseCase Unit Tests', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let mockUserRepo: any;
  let mockSessionRepo: any;
  let mockTokenService: any;

  const activeUser = new User(
    'usr-1',
    'admin',
    'hash',
    1,
    new Date('2020-01-01'),
    new Date('2030-12-31'),
    'SA',
    null
  );

  const activeSession = new UserSession({
    id: 'ses-1',
    userId: 'usr-1',
    refreshTokenHash: 'hash-lama',
    isRevoked: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockUserRepo = {
      findById: vi.fn(),
      findPermissionsByUserId: vi.fn().mockResolvedValue([]),
    };
    mockSessionRepo = {
      findByTokenHash: vi.fn(),
      updateTokenHash: vi.fn().mockResolvedValue({}),
      revoke: vi.fn().mockResolvedValue({}),
      revokeAllForUser: vi.fn().mockResolvedValue({}),
    };
    mockTokenService = {
      sign: vi.fn().mockReturnValue('new-jwt-access-token'),
      generateRefreshToken: vi.fn().mockReturnValue('new-rotated-refresh-token'),
      hashRefreshToken: vi.fn().mockImplementation((t: string) => `hash-${t}`),
    };

    refreshTokenUseCase = new RefreshTokenUseCase(
      mockUserRepo,
      mockSessionRepo,
      mockTokenService
    );
  });

  it('harus berhasil merotasi refresh token dan mengembalikan token baru', async () => {
    mockSessionRepo.findByTokenHash.mockResolvedValue(activeSession);
    mockUserRepo.findById.mockResolvedValue(activeUser);

    const result = await refreshTokenUseCase.execute({
      refreshToken: 'lama',
    });

    expect(result.accessToken).toBe('new-jwt-access-token');
    expect(result.refreshToken).toBe('new-rotated-refresh-token');
    expect(mockSessionRepo.updateTokenHash).toHaveBeenCalledWith(
      'ses-1',
      'hash-new-rotated-refresh-token',
      expect.any(Date)
    );
  });

  it('harus mendeteksi Token Reuse Attack (jika token yang sudah revoked dipakai lagi)', async () => {
    const revokedSession = new UserSession({
      id: 'ses-compromised',
      userId: 'usr-1',
      refreshTokenHash: 'hash-compromised',
      isRevoked: true, // Sudah pernah di-revoke/dipakai
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockSessionRepo.findByTokenHash.mockResolvedValue(revokedSession);

    await expect(
      refreshTokenUseCase.execute({ refreshToken: 'compromised' })
    ).rejects.toThrow('Aktivitas mencurigakan terdeteksi. Seluruh sesi Anda telah dinonaktifkan.');

    // Harus membekukan seluruh sesi milik pengguna tersebut
    expect(mockSessionRepo.revokeAllForUser).toHaveBeenCalledWith('usr-1');
  });

  it('harus melempar error jika sesi telah kedaluwarsa', async () => {
    const expiredSession = new UserSession({
      id: 'ses-expired',
      userId: 'usr-1',
      refreshTokenHash: 'hash-expired',
      isRevoked: false,
      expiresAt: new Date(Date.now() - 1000), // Lewat waktu
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockSessionRepo.findByTokenHash.mockResolvedValue(expiredSession);

    await expect(
      refreshTokenUseCase.execute({ refreshToken: 'expired' })
    ).rejects.toThrow('Sesi Anda telah kedaluwarsa. Silakan login kembali.');
  });
});
