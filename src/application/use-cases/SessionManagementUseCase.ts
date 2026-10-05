import { IUserSessionRepository } from '../../domain/repositories/IUserSessionRepository';
import { ITokenService } from './LoginUseCase';

export interface ActiveSessionDto {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export class SessionManagementUseCase {
  constructor(
    private readonly sessionRepository: IUserSessionRepository,
    private readonly tokenService: ITokenService
  ) {}

  async getActiveSessions(userId: string, currentRefreshToken?: string): Promise<ActiveSessionDto[]> {
    const currentHash = currentRefreshToken
      ? this.tokenService.hashRefreshToken(currentRefreshToken)
      : null;

    const sessions = await this.sessionRepository.findActiveByUserId(userId);

    return sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      expiresAt: s.expiresAt,
      isCurrent: currentHash ? s.refreshTokenHash === currentHash : false,
    }));
  }

  async revokeSession(userId: string, targetSessionId: string): Promise<void> {
    const session = await this.sessionRepository.findById(targetSessionId);
    if (!session || session.userId !== userId) {
      throw new Error('Sesi tidak ditemukan atau bukan milik akun Anda.');
    }
    await this.sessionRepository.revoke(targetSessionId);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.sessionRepository.revokeAllForUser(userId);
  }
}
