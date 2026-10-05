import {
  IUserSessionRepository,
  CreateSessionInput,
} from '../../../domain/repositories/IUserSessionRepository';
import { UserSession } from '../../../domain/entities/UserSession';
import { PrismaService } from '../PrismaService';
import * as crypto from 'crypto';

export class PrismaUserSessionRepository implements IUserSessionRepository {
  private readonly prisma = PrismaService.getClient();

  async create(input: CreateSessionInput): Promise<UserSession> {
    const id = input.id ?? crypto.randomUUID();
    const row = await this.prisma.userSession.create({
      data: {
        id,
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        expiresAt: input.expiresAt,
        isRevoked: false,
      },
    });

    return new UserSession({
      id: row.id,
      userId: row.userId,
      refreshTokenHash: row.refreshTokenHash,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      isRevoked: row.isRevoked,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByTokenHash(refreshTokenHash: string): Promise<UserSession | null> {
    const row = await this.prisma.userSession.findFirst({
      where: { refreshTokenHash },
    });

    if (!row) return null;

    return new UserSession({
      id: row.id,
      userId: row.userId,
      refreshTokenHash: row.refreshTokenHash,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      isRevoked: row.isRevoked,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<UserSession | null> {
    const row = await this.prisma.userSession.findUnique({
      where: { id },
    });

    if (!row) return null;

    return new UserSession({
      id: row.id,
      userId: row.userId,
      refreshTokenHash: row.refreshTokenHash,
      ipAddress: row.ipAddress,
      userAgent: row.userAgent,
      isRevoked: row.isRevoked,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findActiveByUserId(userId: string): Promise<UserSession[]> {
    const rows = await this.prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(
      (row) =>
        new UserSession({
          id: row.id,
          userId: row.userId,
          refreshTokenHash: row.refreshTokenHash,
          ipAddress: row.ipAddress,
          userAgent: row.userAgent,
          isRevoked: row.isRevoked,
          expiresAt: row.expiresAt,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })
    );
  }

  async updateTokenHash(sessionId: string, newHash: string, newExpiresAt: Date): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: newHash,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      },
    });
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        isRevoked: true,
        updatedAt: new Date(),
      },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        updatedAt: new Date(),
      },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}
