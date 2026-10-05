# Laporan Pengujian (Unit Testing & E2E Testing)
### Service: `auth-platform-backend` & `admin-dashboard`

Dokumen ini memuat hasil komprehensif pengujian perangkat lunak (*Automated Software Testing*) yang mencakup **Unit Testing**, **Integration Testing**, dan **End-to-End (E2E) API Testing**.

---

## 📊 1. Ringkasan Eksekutif Pengujian

* **Total Test Suites**: **13 File Pengujian**
* **Total Kasus Uji (Test Cases)**: **45 Skenario Uji**
* **Tingkat Kelulusan (Pass Rate)**: **100% (45 Lolos, 0 Gagal)**
* **Waktu Eksekusi**: ~3.5 detik (Vitest Runner)

```
========================================================================
 KOMPONEN PROYEK         | TEST FILES | PASSED | FAILED | STATUS
========================================================================
 auth-platform-backend   |     7      |   31   |   0    |  ✅ PASSED
 admin-dashboard         |     6      |   14   |   0    |  ✅ PASSED
------------------------------------------------------------------------
 TOTAL KESELURUHAN       |    13      |   45   |   0    |  ✅ 100% PASS
========================================================================
```

---

## 🧪 2. Detail Pengujian Backend (`auth-platform-backend`)

### A. Unit Testing Layer (23 Kasus Uji)
1. **`LegacyHasher.test.ts` (5 Skenario)**:
   - ✅ Verifikasi pembuatan hash legacy format MySQL SHA1 ganda (`*01A6717B...`).
   - ✅ Verifikasi pencocokan kata sandi format legacy (`admin123` cocok dengan hash legacy).
   - ✅ Verifikasi pembuatan hash modern **`bcrypt` (Cost Factor 12)** (`$2b$12$...`).
   - ✅ Verifikasi pencocokan kata sandi format bcrypt (`bcrypt.compare`).
   - ✅ Verifikasi deteksi otomatis `needsRehash()` (Return `true` untuk format legacy, `false` untuk bcrypt).

2. **`UserSession.test.ts` (4 Skenario)**:
   - ✅ Status keabsahan sesi aktif (`isValid() = true`).
   - ✅ Penolakan sesi jika flag `isRevoked = true` (`isValid() = false`).
   - ✅ Penolakan sesi jika tanggal kedaluwarsa telah lewat (`expiresAt < now`).
   - ✅ Eksekusi metode `revoke()` mengubah status sesi menjadi revoked.

3. **`User.test.ts` (4 Skenario)**:
   - ✅ Akun aktif jika `aktif = 1` dan tanggal hari ini di dalam rentang `tgl_1 <= now <= tgl_2`.
   - ✅ Penolakan login jika status `aktif = 0`.
   - ✅ Penolakan login jika masa aktif akun belum dimulai (`now < tgl_1`).
   - ✅ Penolakan login jika masa aktif akun telah habis (`now > tgl_2`).

4. **`LoginUseCase.test.ts` (5 Skenario)**:
   - ✅ Berhasil login dengan kredensial sah dan menghasilkan dual-token (`accessToken` 15m + `refreshToken` 7d).
   - ✅ Memicu **Transparent Lazy Re-hashing** otomatis jika akun masih berformat legacy.
   - ✅ Melempar exception jika akun pengguna tidak ditemukan di database.
   - ✅ Melempar exception dan mencatat audit log `GAGAL` jika kata sandi salah.
   - ✅ Melempar exception dan mencatat audit log `GAGAL` jika masa berlaku akun kedaluwarsa.

5. **`RefreshTokenUseCase.test.ts` (3 Skenario)**:
   - ✅ Berhasil merotasi token (**Refresh Token Rotation / RTR**) dan memperpanjang masa aktif.
   - ✅ Mendeteksi **Token Reuse Attack**: jika token yang sudah hangus dicoba dipakai ulang, seluruh sesi pengguna tersebut otomatis dibekukan demi keamanan.
   - ✅ Menolak perpanjangan jika sesi telah kedaluwarsa.

6. **`LogoutUseCase.test.ts` (2 Skenario)**:
   - ✅ Membatalkan sesi aktif berdasarkan `refreshToken`.
   - ✅ Membatalkan sesi aktif berdasarkan `sessionId` spesifik.

---

### B. End-to-End (E2E) Integration Testing (`auth.e2e.test.ts` - 8 Kasus Uji)
Menguji langsung aliran HTTP Express terhadap database PostgreSQL:
1. ✅ **`POST /api/auth/login`**: Berhasil login dengan user `admin`, mengembalikan status 200, JWT token, dan memasang HttpOnly Cookie `refreshToken`.
2. ✅ **`POST /api/auth/login`**: Menolak login dengan kata sandi salah (Status 400 Bad Request).
3. ✅ **`GET /api/auth/profile`**: Berhasil mengakses profil pengguna menggunakan Bearer Token (Status 200 OK).
4. ✅ **`GET /api/auth/profile`**: Menolak akses jika Authorization header kosong (Status 401 Unauthorized).
5. ✅ **`POST /api/auth/refresh`**: Berhasil merotasi token menggunakan HttpOnly Cookie (Token baru berbeda dengan token lama).
6. ✅ **`GET /api/auth/sessions`**: Berhasil mengambil daftar sesi perangkat aktif.
7. ✅ **`POST /api/auth/logout`**: Berhasil membatalkan sesi dan membersihkan HttpOnly Cookie (`Expires=1970`).
8. ✅ **`POST /api/auth/refresh`**: Menolak perpanjangan jika menggunakan token yang telah di-logout (Status 401).

---

## 🎨 3. Detail Pengujian Frontend (`admin-dashboard`) (14 Kasus Uji)

1. **`OperationUnitMapper.test.ts` (2 Skenario)**: Validasi transformasi DTO ke domain model unit organisasi & hierarki lineage.
2. **`ManagementMapper.test.ts` (3 Skenario)**: Validasi pemetaan entitas pengguna, role, dan izin menu.
3. **`permissions.test.ts` (2 Skenario)**: Validasi kalkulasi bitmask izin operasi CRUD (Create, Read, Update, Delete).
4. **`environment.test.ts` (3 Skenario)**: Validasi resolusi URL endpoint backend pada mode dev, staging, dan prod.
5. **`sortMenus.test.ts` (3 Skenario)**: Validasi logika penyusunan urutan menu berdasarkan `urut` dan level hierarki.
6. **`ErrorBoundary.test.tsx` (1 Skenario)**: Validasi penanganan crash rendering UI pada komponen React.

---

## 🚀 4. Cara Menjalankan Uji Coba Secara Mandiri

```bash
# Menjalankan seluruh pengujian di backend:
cd auth-platform-backend
npm test

# Menjalankan seluruh pengujian di frontend:
cd ../admin-dashboard
npm test
```
