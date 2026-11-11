import { describe, it, expect } from 'vitest';
import { PasswordValidator, COMMON_PASSWORDS_BLACKLIST } from '../../src/infrastructure/security/PasswordValidator';

describe('Backend PasswordValidator Unit Tests (NIST SP 800-63B & OWASP ASVS 4.0)', () => {
  it('should reject password with length < 8', () => {
    const res = PasswordValidator.validate('Ab1!xyz');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Password harus memiliki minimal 8 karakter.');
  });

  it('should reject password exceeding 128 characters', () => {
    const longPass = 'A1!a' + 'x'.repeat(126);
    const res = PasswordValidator.validate(longPass);
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Password tidak boleh melebihi 128 karakter.');
  });

  it('should reject password missing uppercase', () => {
    const res = PasswordValidator.validate('validpassword123!@#');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Password harus mengandung minimal satu huruf besar (A-Z).');
  });

  it('should reject password missing lowercase', () => {
    const res = PasswordValidator.validate('VALIDPASSWORD123!@#');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Password harus mengandung minimal satu huruf kecil (a-z).');
  });

  it('should reject password missing number', () => {
    const res = PasswordValidator.validate('ValidPasswordWithoutDigit!@#');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Password harus mengandung minimal satu angka (0-9).');
  });

  it('should reject password missing special characters', () => {
    const res = PasswordValidator.validate('ValidPasswordWithoutSymbol123');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Password harus mengandung minimal satu simbol/karakter khusus (!@#$%^&*).');
  });

  it('should reject password containing username (case-insensitive)', () => {
    const res = PasswordValidator.validate('SuperSecureJono#2026', 'jono');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('Password tidak boleh mengandung nama username akun.');
  });

  it('should reject blacklisted passwords', () => {
    for (const common of COMMON_PASSWORDS_BLACKLIST) {
      const res = PasswordValidator.validate(common);
      expect(res.isValid).toBe(false);
    }
  });

  it('should accept valid international-standard secure password', () => {
    const res = PasswordValidator.validate('Hser4Security#2026!', 'budi');
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
  });
});
