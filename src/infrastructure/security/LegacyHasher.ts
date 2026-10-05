import { IPasswordHasher } from '../../application/use-cases/LoginUseCase';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export class LegacyHasher implements IPasswordHasher {
  private readonly saltRounds = 12;

  /**
   * Menghasilkan hash modern bcrypt dengan cost factor 12.
   */
  public hash(password: string): string {
    return bcrypt.hashSync(password, this.saltRounds);
  }

  /**
   * Menghasilkan hash sandi yang kompatibel dengan fungsi PASSWORD() MySQL lama.
   * Formula: *UPPERCASE(SHA1(UNHEX(SHA1(password))))
   */
  public hashLegacy(password: string): string {
    const sha1First = crypto.createHash('sha1').update(password).digest();
    const sha1Second = crypto.createHash('sha1').update(sha1First).digest('hex');
    return `*${sha1Second.toUpperCase()}`;
  }

  /**
   * Memverifikasi password plain terhadap hash yang tersimpan.
   * Mendukung bcrypt ($2a$, $2b$, $2y$), hash legacy MySQL (*), dan fallback teks biasa.
   */
  public compare(plain: string, hashed: string): boolean {
    if (!plain || !hashed) return false;

    // 1. Format Modern Bcrypt
    if (hashed.startsWith('$2a$') || hashed.startsWith('$2b$') || hashed.startsWith('$2y$')) {
      try {
        return bcrypt.compareSync(plain, hashed);
      } catch {
        return false;
      }
    }

    // 2. Dukung format enkripsi lama MySQL
    if (hashed.startsWith('*')) {
      return this.hashLegacy(plain) === hashed;
    }

    // 3. Fallback pencocokan teks biasa jika ada sandi yang belum terenkripsi
    return plain === hashed;
  }

  /**
   * Menentukan apakah password yang tersimpan perlu di-upgrade ke bcrypt modern.
   * Mengembalikan true jika hash masih berformat legacy '*' atau plaintext.
   */
  public needsRehash(hashed: string): boolean {
    if (!hashed) return true;
    if (hashed.startsWith('$2a$') || hashed.startsWith('$2b$') || hashed.startsWith('$2y$')) {
      return false;
    }
    return true;
  }
}

