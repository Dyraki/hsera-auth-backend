/**
 * Password Security Validator Backend
 * Standar Internasional NIST SP 800-63B & OWASP ASVS 4.0
 */

export const COMMON_PASSWORDS_BLACKLIST = new Set([
  'password',
  'password123',
  'admin123',
  'administrator',
  '12345678',
  '123456789',
  '1234567890',
  'qwertyuiop',
  'qwerty123',
  'hsera123',
  'indonesia',
  'secret123',
  'welcome123',
  'root1234',
]);

const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`'"]/;

function hasSequentialOrRepeatedPattern(password: string): boolean {
  if (password.length < 4) return false;
  // Cek 4 karakter berulang yang sama persis (misal: aaaa, 1111)
  if (/(.)\1{3,}/.test(password)) return true;

  // Cek urutan alfabetik atau numerik 4 karakter (misal: 1234, abcd)
  const lower = password.toLowerCase();
  for (let i = 0; i <= lower.length - 4; i++) {
    const c1 = lower.charCodeAt(i);
    const c2 = lower.charCodeAt(i + 1);
    const c3 = lower.charCodeAt(i + 2);
    const c4 = lower.charCodeAt(i + 3);
    if (c2 === c1 + 1 && c3 === c2 + 1 && c4 === c3 + 1) return true;
    if (c2 === c1 - 1 && c3 === c2 - 1 && c4 === c3 - 1) return true;
  }

  return false;
}

export class PasswordValidator {
  /**
   * Memvalidasi password sesuai standar NIST SP 800-63B & OWASP ASVS 4.0
   */
  public static validate(
    password: string,
    username?: string
  ): { isValid: boolean; error?: string } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password wajib diisi.' };
    }

    if (password.length < 8) {
      return { isValid: false, error: 'Password harus memiliki minimal 8 karakter.' };
    }

    if (password.length > 128) {
      return { isValid: false, error: 'Password tidak boleh melebihi 128 karakter.' };
    }

    if (!/[A-Z]/.test(password)) {
      return { isValid: false, error: 'Password harus mengandung minimal satu huruf besar (A-Z).' };
    }

    if (!/[a-z]/.test(password)) {
      return { isValid: false, error: 'Password harus mengandung minimal satu huruf kecil (a-z).' };
    }

    if (!/[0-9]/.test(password)) {
      return { isValid: false, error: 'Password harus mengandung minimal satu angka (0-9).' };
    }

    if (!SPECIAL_CHARS_REGEX.test(password)) {
      return { isValid: false, error: 'Password harus mengandung minimal satu simbol/karakter khusus (!@#$%^&*).' };
    }

    if (username && username.trim().length >= 3) {
      if (password.toLowerCase().includes(username.trim().toLowerCase())) {
        return { isValid: false, error: 'Password tidak boleh mengandung nama username akun.' };
      }
    }

    if (COMMON_PASSWORDS_BLACKLIST.has(password.toLowerCase())) {
      return { isValid: false, error: 'Password terlalu umum dan mudah ditebak, gunakan variasi lain.' };
    }

    if (hasSequentialOrRepeatedPattern(password)) {
      return { isValid: false, error: 'Password mengandung pola berulang atau berurutan sederhana.' };
    }

    return { isValid: true };
  }
}
