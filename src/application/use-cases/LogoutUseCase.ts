import { IUserSessionRepository } from '../../domain/repositories/IUserSessionRepository';
import { ITokenService } from './LoginUseCase';

export interface LogoutRequestDto {
  refreshToken?: string;
  sessionId?: string;
}

export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: IUserSessionRepository,
    private readonly tokenService: ITokenService
  ) {}

  async execute(request: LogoutRequestDto): Promise<void> {
    if (request.refreshToken) {
      const hash = this.tokenService.hashRefreshToken(request.refreshToken);
      const session = await this.sessionRepository.findByTokenHash(hash);
      if (session) {
        await this.sessionRepository.revoke(session.id);
        return;
      }
    }

    if (request.sessionId) {
      await this.sessionRepository.revoke(request.sessionId);
    }
  }
}
