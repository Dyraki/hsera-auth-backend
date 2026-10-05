import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/presentation/index';

describe('Auth & Session Management E2E Tests', () => {
  let accessToken: string;
  let refreshToken: string;
  let sessionCookie: string;

  it('1. POST /api/auth/login - Berhasil masuk dengan kredensial admin dan mendapatkan dual-token + HttpOnly Cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.username).toBe('admin');

    // Pastikan cookie refreshToken diset dengan HttpOnly
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('refreshToken=');
    expect(cookies[0]).toContain('HttpOnly');

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
    sessionCookie = cookies[0];
  });

  it('2. POST /api/auth/login - Gagal jika kata sandi salah (HTTP 400)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'salahpassword123',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Username atau password tidak cocok');
  });

  it('3. GET /api/auth/profile - Berhasil mengakses profil dengan Bearer Access Token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('admin');
  });

  it('4. GET /api/auth/profile - Ditolak jika tanpa Authorization Token (HTTP 401)', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  it('5. POST /api/auth/refresh - Berhasil merotasi token via Cookie (Refresh Token Rotation)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.refreshToken).not.toBe(refreshToken); // Token harus berganti (berotasi)

    // Update token aktif untuk pengujian berikutnya
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
    const cookies = res.headers['set-cookie'];
    sessionCookie = cookies[0];
  });

  it('6. GET /api/auth/sessions - Berhasil melihat daftar sesi perangkat aktif', async () => {
    const res = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('7. POST /api/auth/logout - Berhasil keluar dan membersihkan cookie sesi', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Berhasil keluar.');

    // Cookie harus kedaluwarsa / dihapus
    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toContain('Expires=Thu, 01 Jan 1970');
  });

  it('8. POST /api/auth/refresh - Gagal menggunakan refresh token yang telah di-logout (HTTP 401)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
  });
});
