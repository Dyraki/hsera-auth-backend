import { describe, it, expect } from 'vitest';
import { LegacyHasher } from '../../src/infrastructure/security/LegacyHasher';

describe('LegacyHasher (Bcrypt & Legacy SHA1 Hash Unit Tests)', () => {
  const hasher = new LegacyHasher();
  const rawPassword = 'admin123';
  // MySQL legacy double-SHA1 hash untuk "admin123"
  const legacyHash = '*01A6717B58FF5C7EAFFF6CB7C96F7428EA65FE4C';

  it('harus menghasilkan hash legacy MySQL SHA1 ganda yang diawali "*"', () => {
    const hash = hasher.hashLegacy(rawPassword);
    expect(hash).toBe(legacyHash);
    expect(hash.startsWith('*')).toBe(true);
  });

  it('harus memvalidasi kata sandi dengan hash legacy MySQL', () => {
    const isValid = hasher.compare(rawPassword, legacyHash);
    expect(isValid).toBe(true);

    const isInvalid = hasher.compare('wrongpassword', legacyHash);
    expect(isInvalid).toBe(false);
  });

  it('harus menghasilkan hash modern Bcrypt dengan cost factor 12 ($2a$ atau $2b$)', () => {
    const bcryptHash = hasher.hash(rawPassword);
    expect(bcryptHash.startsWith('$2a$') || bcryptHash.startsWith('$2b$')).toBe(true);
    expect(bcryptHash).not.toBe(rawPassword);
  });

  it('harus memvalidasi kata sandi dengan hash modern Bcrypt', () => {
    const bcryptHash = hasher.hash(rawPassword);
    const isValid = hasher.compare(rawPassword, bcryptHash);
    expect(isValid).toBe(true);

    const isInvalid = hasher.compare('wrongpassword', bcryptHash);
    expect(isInvalid).toBe(false);
  });

  it('harus mendeteksi needsRehash() bernilai TRUE untuk format legacy dan FALSE untuk bcrypt', () => {
    expect(hasher.needsRehash(legacyHash)).toBe(true);
    expect(hasher.needsRehash('plaintext123')).toBe(true);

    const bcryptHash = hasher.hash(rawPassword);
    expect(hasher.needsRehash(bcryptHash)).toBe(false);
  });
});
