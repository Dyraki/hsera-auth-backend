import { describe, it, expect } from 'vitest';
import { User } from '../../src/domain/entities/User';

describe('User Entity Unit Tests', () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const farPast = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const farFuture = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  it('harus aktif jika aktif=1 dan tanggal hari ini di antara tglMulai dan tglSelesai', () => {
    const user = new User(
      'uuid-1',
      'budi',
      'hash',
      1,
      yesterday,
      tomorrow,
      'pegawai',
      null
    );

    expect(user.isAccountActive()).toBe(true);
  });

  it('harus nonaktif jika status aktif=0', () => {
    const user = new User(
      'uuid-2',
      'budi',
      'hash',
      0, // Nonaktif
      yesterday,
      tomorrow,
      'pegawai',
      null
    );

    expect(user.isAccountActive()).toBe(false);
  });

  it('harus nonaktif jika masa berlaku akun belum dimulai (tglMulai di masa depan)', () => {
    const user = new User(
      'uuid-3',
      'budi',
      'hash',
      1,
      tomorrow, // Belum mulai
      farFuture,
      'pegawai',
      null
    );

    expect(user.isAccountActive()).toBe(false);
  });

  it('harus nonaktif jika masa berlaku akun telah berakhir (tglSelesai di masa lalu)', () => {
    const user = new User(
      'uuid-4',
      'budi',
      'hash',
      1,
      farPast,
      yesterday, // Sudah lewat
      'pegawai',
      null
    );

    expect(user.isAccountActive()).toBe(false);
  });
});
