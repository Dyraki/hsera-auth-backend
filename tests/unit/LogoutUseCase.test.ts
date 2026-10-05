import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutUseCase } from '../../src/application/use-cases/LogoutUseCase';
import { UserSession } from '../../src/domain/entities/UserSession';

describe('LogoutUseCase Unit Tests', () => {
  let logoutUseCase: LogoutUseCase;
  let mockSessionRepo: any;
  let mockTokenService: any;

  beforeEach(() => {
    mockSessionRepo = {
      findByTokenHash: vi.fn(),
      revoke: vi.fn().mockResolvedValue({}),
    };
    mockTokenService = {
      hashRefreshToken: vi.fn().mockReturnValue('hashed-token-xyz'),
    };

    logoutUseCase = new LogoutUseCase(mockSessionRepo, mockTokenService);
  });

  it('harus membatalkan sesi jika diberikan refreshToken valid', async () => {
    const mockSession = new UserSession({
      id: 'session-id-123',
      userId: 'user-id-456',
      refreshTokenHash: 'hashed-token-xyz',
      isRevoked: false,
      expiresAt: new Date(Date.now() + 100000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockSessionRepo.findByTokenHash.mockResolvedValue(mockSession);

    await logoutUseCase.execute({ refreshToken: 'raw-token-xyz' });

    expect(mockTokenService.hashRefreshToken).toHaveBeenCalledWith('raw-token-xyz');
    expect(mockSessionRepo.revoke).toHaveBeenCalledWith('session-id-123');
  });

  it('harus membatalkan sesi jika diberikan sessionId langsung', async () => {
    await logoutUseCase.execute({ sessionId: 'session-target-id' });
    expect(mockSessionRepo.revoke).toHaveBeenCalledWith('session-target-id');
  });
});
