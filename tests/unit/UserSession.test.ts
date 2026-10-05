import { describe, it, expect } from 'vitest';
import { UserSession } from '../../src/domain/entities/UserSession';

describe('UserSession Entity Unit Tests', () => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const pastDate = new Date(Date.now() - 1000);

  it('harus bernilai valid jika tidak di-revoke dan belum kedaluwarsa', () => {
    const session = new UserSession({
      id: 'session-uuid-1',
      userId: 'user-uuid-1',
      refreshTokenHash: 'hash123',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      isRevoked: false,
      expiresAt: futureDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(session.isValid()).toBe(true);
    expect(session.isRevoked).toBe(false);
  });

  it('harus bernilai tidak valid jika isRevoked bernilai true', () => {
    const session = new UserSession({
      id: 'session-uuid-2',
      userId: 'user-uuid-1',
      refreshTokenHash: 'hash123',
      isRevoked: true,
      expiresAt: futureDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(session.isValid()).toBe(false);
  });

  it('harus bernilai tidak valid jika expiresAt telah terlewati (kedaluwarsa)', () => {
    const session = new UserSession({
      id: 'session-uuid-3',
      userId: 'user-uuid-1',
      refreshTokenHash: 'hash123',
      isRevoked: false,
      expiresAt: pastDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(session.isValid()).toBe(false);
  });

  it('metode revoke() harus mengubah status isRevoked menjadi true', () => {
    const session = new UserSession({
      id: 'session-uuid-4',
      userId: 'user-uuid-1',
      refreshTokenHash: 'hash123',
      isRevoked: false,
      expiresAt: futureDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(session.isValid()).toBe(true);
    session.revoke();
    expect(session.isRevoked).toBe(true);
    expect(session.isValid()).toBe(false);
  });
});
