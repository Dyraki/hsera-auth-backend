import { UserSession } from '../entities/UserSession';

export interface CreateSessionInput {
  id?: string;
  userId: string;
  refreshTokenHash: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
}

export interface IUserSessionRepository {
  create(input: CreateSessionInput): Promise<UserSession>;
  findByTokenHash(refreshTokenHash: string): Promise<UserSession | null>;
  findById(id: string): Promise<UserSession | null>;
  findActiveByUserId(userId: string): Promise<UserSession[]>;
  updateTokenHash(sessionId: string, newHash: string, newExpiresAt: Date): Promise<void>;
  revoke(sessionId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
